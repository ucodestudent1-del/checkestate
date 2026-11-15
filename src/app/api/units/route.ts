import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization } from "@/lib/session";
import { db, Prisma } from "@/lib/db";
import { withErrorHandler } from "@/lib/api-middleware";
import { handleApiError } from "@/lib/errors";

const unitSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  unitNumber: z.string().min(1, "Unit number is required"),
  floor: z.string().optional(),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  squareFeet: z.string().optional(),
  status: z.string().optional(),
});

const GET = withErrorHandler(async (req: NextRequest) => {
  const { organizationId } = await requireOrganization();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const search = searchParams.get("search") || "";
  const propertyId = searchParams.get("propertyId") || undefined;

  const where: Prisma.UnitWhereInput = {
    organizationId,
    deletedAt: null,
    ...(propertyId ? { propertyId } : {}),
    ...(search
      ? { unitNumber: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [units, total] = await Promise.all([
    db.unit.findMany({
      where,
      include: { property: true, tenant: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.unit.count({ where }),
  ]);

  return NextResponse.json({
    data: units,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

const POST = withErrorHandler(async (req: NextRequest) => {
  const { organizationId } = await requireOrganization();
  const body = await req.json();
  const data = unitSchema.parse(body);

  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: { unitLimit: true, _count: { select: { units: true } } },
  });

  if (org && org._count.units >= org.unitLimit) {
    return NextResponse.json(
      { error: `Unit limit reached. Your plan allows up to ${org.unitLimit} units.` },
      { status: 403 }
    );
  }

  const unit = await db.unit.create({
    data: {
      organizationId,
      propertyId: data.propertyId,
      unitNumber: data.unitNumber,
      floor: data.floor ? parseInt(data.floor) : null,
      bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
      bathrooms: data.bathrooms ? parseInt(data.bathrooms) : null,
      squareFeet: data.squareFeet ? parseInt(data.squareFeet) : null,
      status: data.status || "VACANT",
    },
  });

  return NextResponse.json(unit, { status: 201 });
});

export { GET, POST };
