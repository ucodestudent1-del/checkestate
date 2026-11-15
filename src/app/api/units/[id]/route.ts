import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization } from "@/lib/session";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

const unitParamSchema = z.object({ id: z.string() });

const updateUnitSchema = z.object({
  propertyId: z.string().optional(),
  unitNumber: z.string().optional(),
  floor: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  squareFeet: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId } = await requireOrganization();
    const { id } = unitParamSchema.parse(await params);
    const unit = await db.unit.findFirst({ where: { id, organizationId }, include: { property: true, tenant: true } });
    if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    return NextResponse.json(unit);
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId } = await requireOrganization();
    const { id } = unitParamSchema.parse(await params);
    const body = await req.json();
    const data = updateUnitSchema.parse(body);

    const updateData: any = { ...data, organizationId };
    if (data.floor) updateData.floor = parseInt(data.floor);
    if (data.bedrooms) updateData.bedrooms = parseInt(data.bedrooms);
    if (data.bathrooms) updateData.bathrooms = parseInt(data.bathrooms);
    if (data.squareFeet) updateData.squareFeet = parseInt(data.squareFeet);

    const unit = await db.unit.update({ where: { id }, data: updateData });
    return NextResponse.json(unit);
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organizationId } = await requireOrganization();
    const { id } = unitParamSchema.parse(await params);
    const unit = await db.unit.findFirst({ where: { id, organizationId } });
    if (!unit) return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    await db.unit.delete({ where: { id } });
    return NextResponse.json({ message: "Unit deleted" });
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}
