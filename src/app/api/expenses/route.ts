import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization } from "@/lib/session";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

const expenseSchema = z.object({
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  workOrderId: z.string().optional(),
  contractorId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  estimatedCost: z.string().optional(),
  approvedCost: z.string().optional(),
  actualCost: z.string().min(1, "Actual cost is required"),
  invoiceNumber: z.string().optional(),
  receiptUrl: z.string().optional(),
  expenseDate: z.string(),
  paymentStatus: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const [expenses, total] = await Promise.all([
      db.maintenanceExpense.findMany({
        where: { organizationId },
        include: { property: true, contractor: true },
        orderBy: { expenseDate: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.maintenanceExpense.count({ where: { organizationId } }),
    ]);

    return NextResponse.json({ data: expenses, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
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
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}
