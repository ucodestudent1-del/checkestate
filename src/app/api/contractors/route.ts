import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization } from "@/lib/session";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

const contractorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  businessName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  tradeSpecialization: z.string().optional(),
  serviceAreas: z.string().optional(),
  insuranceInfo: z.string().optional(),
  licenseInfo: z.string().optional(),
  documentExpiryDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";

    const where = {
      organizationId,
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { businessName: { contains: search, mode: "insensitive" } }] } : {}),
    };

    const [contractors, total] = await Promise.all([
      db.contractor.findMany({
        where,
        include: { _count: { select: { workOrderAssignments: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.contractor.count({ where }),
    ]);

    return NextResponse.json({ data: contractors, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const body = await req.json();
    const data = contractorSchema.parse(body);

    const contractor = await db.contractor.create({
      data: {
        organizationId,
        name: data.name,
        businessName: data.businessName || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        tradeSpecialization: data.tradeSpecialization || null,
        serviceAreas: data.serviceAreas || null,
        insuranceInfo: data.insuranceInfo || null,
        licenseInfo: data.licenseInfo || null,
        documentExpiryDate: data.documentExpiryDate ? new Date(data.documentExpiryDate) : null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json(contractor, { status: 201 });
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}
