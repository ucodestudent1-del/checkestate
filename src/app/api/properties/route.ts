import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

const propertySchema = z.object({
  name: z.string().min(1, "Property name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  propertyType: z.string().min(1, "Property type is required"),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const city = searchParams.get("city") || "";
    const state = searchParams.get("state") || "";
    const propertyType = searchParams.get("propertyType") || "";

    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" as const } },
        { address: { contains: search, mode: "insensitive" as const } },
        { city: { contains: search, mode: "insensitive" as const } },
      ];
    }
    if (city) where.city = { equals: city, mode: "insensitive" as const };
    if (state) where.state = { equals: state, mode: "insensitive" as const };
    if (propertyType) where.propertyType = { equals: propertyType, mode: "insensitive" as const };

    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        include: {
          _count: { select: { units: true, maintenanceRequests: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.property.count({ where }),
    ]);

    return NextResponse.json({
      data: properties,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const body = await req.json();
    const data = propertySchema.parse(body);

    // Check plan limits
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: { unitLimit: true, _count: { select: { properties: true } } },
    });

    if (org && org._count.properties >= org.unitLimit) {
      return NextResponse.json(
        { error: `Property limit reached. Your plan allows up to ${org.unitLimit} properties.` },
        { status: 403 }
      );
    }

    const property = await db.property.create({
      data: {
        ...data,
        organizationId,
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
