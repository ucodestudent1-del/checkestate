import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization } from "@/lib/session";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/api-middleware";
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

const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { organizationId } = await requireOrganization();
  const { id } = propertyParamSchema.parse(await params);
  const property = await db.property.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      units: { include: { tenant: true } },
      _count: { select: { maintenanceRequests: true, maintenanceExpenses: true } },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  return NextResponse.json(property);
});

const PATCH = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { organizationId } = await requireOrganization();
  const { id } = propertyParamSchema.parse(await params);
  const body = await req.json();
  const data = updatePropertySchema.parse(body);

  // Explicitly exclude organizationId from updatable fields to prevent org ownership change
  const { organizationId: _, ...updateData } = data as { organizationId?: string };

  const property = await db.property.update({
    where: { id },
    data: { ...updateData, organizationId },
  });

  return NextResponse.json(property);
});

const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { organizationId } = await requireOrganization();
  const { id } = propertyParamSchema.parse(await params);
  const property = await db.property.findFirst({
    where: { id, organizationId, deletedAt: null },
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

  // Soft delete
  await db.property.update({ where: { id }, data: { deletedAt: new Date() } });

  return NextResponse.json({ message: "Property deleted" });
});

export { GET, PATCH, DELETE };
