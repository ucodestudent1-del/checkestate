import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization } from "@/lib/session";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

const propertyParamSchema = z.object({
  id: z.string(),
});

const updatePropertySchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  zipCode: z.string().min(1).optional(),
  propertyType: z.string().min(1).optional(),
  description: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId } = await requireOrganization();
    const { id } = propertyParamSchema.parse(await params);
    const property = await db.property.findFirst({
      where: { id, organizationId },
      include: {
        units: { include: { tenant: true } },
        _count: { select: { maintenanceRequests: true, maintenanceExpenses: true } },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json(property);
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId } = await requireOrganization();
    const { id } = propertyParamSchema.parse(await params);
    const body = await req.json();
    const data = updatePropertySchema.parse(body);

    const property = await db.property.update({
      where: { id },
      data: { ...data, organizationId },
    });

    return NextResponse.json(property);
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId } = await requireOrganization();
    const { id } = propertyParamSchema.parse(await params);
    const property = await db.property.findFirst({
      where: { id, organizationId },
      include: { _count: { select: { units: true } } },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (property._count.units > 0) {
      return NextResponse.json(
        { error: "Cannot delete property with existing units. Remove units first." },
        { status: 400 }
      );
    }

    await db.property.delete({ where: { id } });

    return NextResponse.json({ message: "Property deleted" });
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}
