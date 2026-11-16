import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization } from "@/lib/session";
import { db } from "@/lib/db";
import { withErrorHandler } from "@/lib/api-middleware";
import { handleApiError } from "@/lib/errors";

const expenseSchema = z.object({
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  workOrderId: z.string().optional(),
  contractorId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.enum(["PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "PEST_CONTROL", "CLEANING", "LANDSCAPING", "PAINTING", "CARPENTRY", "ROOFING", "SECURITY", "OTHER"]),
  estimatedCost: z.string().optional(),
  approvedCost: z.string().optional(),
  actualCost: z.string().min(1, "Actual cost is required"),
  invoiceNumber: z.string().optional(),
  receiptUrl: z.string().optional(),
  expenseDate: z.string(),
  paymentStatus: z.string().optional(),
});

const GET = withErrorHandler(async (req: NextRequest) => {
  const { organizationId } = await requireOrganization();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  const [expenses, total] = await Promise.all([
    db.maintenanceExpense.findMany({
      where: { organizationId, deletedAt: null },
      include: { property: true, contractor: true },
      orderBy: { expenseDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.maintenanceExpense.count({ where: { organizationId, deletedAt: null } }),
  ]);

  return NextResponse.json({ data: expenses, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
});

const POST = withErrorHandler(async (req: NextRequest) => {
  const { organizationId } = await requireOrganization();
  const body = await req.json();
  const data = expenseSchema.parse(body);

  const expense = await db.maintenanceExpense.create({
    data: {
      organizationId,
      propertyId: data.propertyId || null,
      unitId: data.unitId || null,
      workOrderId: data.workOrderId || null,
      contractorId: data.contractorId || null,
      title: data.title,
      description: data.description || null,
      category: data.category as any,
      estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : null,
      approvedCost: data.approvedCost ? parseFloat(data.approvedCost) : null,
      actualCost: parseFloat(data.actualCost),
      invoiceNumber: data.invoiceNumber || null,
      receiptUrl: data.receiptUrl || null,
      expenseDate: new Date(data.expenseDate),
      paymentStatus: data.paymentStatus || "UNPAID",
    },
  });

  return NextResponse.json(expense, { status: 201 });
});

export { GET, POST };
