import { NextRequest, NextResponse } from "next/server";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireOrganization();
    const user = await getCurrentUser();

    if (user.role !== "TENANT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenant = await db.tenant.findFirst({
      where: { userId: user.id, organizationId: ctx.organizationId },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ data: [] });
    }

    const properties = await db.property.findMany({
      where: { organizationId: ctx.organizationId },
      include: {
        units: {
          where: { tenantId: tenant.id },
          select: { id: true, unitNumber: true },
        },
      },
    });

    return NextResponse.json({
      data: properties.map((p: { id: string; name: string; address: string; city: string; state: string; zipCode: string; units: { id: string; unitNumber: string }[] }) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        city: p.city,
        state: p.state,
        zipCode: p.zipCode,
        units: p.units,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}