import { NextRequest, NextResponse } from "next/server";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const updateContractorWorkOrderSchema = z.object({
  status: z.string().optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireOrganization();
    const user = await getCurrentUser();

    if (user.role !== "CONTRACTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contractor = await db.contractor.findFirst({
      where: { email: user.email, organizationId: ctx.organizationId },
    });

    if (!contractor) {
      return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status") || undefined;

    const where: any = {
      organizationId: ctx.organizationId,
      assignments: {
        some: { contractorId: contractor.id },
      },
    };

    if (status) where.status = status;

    const [workOrders, total] = await Promise.all([
      db.workOrder.findMany({
        where,
        include: {
          maintenanceRequest: { include: { property: true, unit: true } },
          assignedTo: true,
          assignments: { where: { contractorId: contractor.id }, include: { contractor: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.workOrder.count({ where }),
    ]);

    return NextResponse.json({ data: workOrders, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireOrganization();
    const user = await getCurrentUser();

    if (user.role !== "CONTRACTOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contractor = await db.contractor.findFirst({
      where: { email: user.email, organizationId: ctx.organizationId },
    });

    if (!contractor) {
      return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Work order ID required" }, { status: 400 });

    const workOrder = await db.workOrder.findFirst({
      where: { id, organizationId: ctx.organizationId },
      include: { assignments: { where: { contractorId: contractor.id } } },
    });

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }

    const isAssigned = workOrder.assignments.some((a: { contractorId: string }) => a.contractorId === contractor.id);
    if (!isAssigned) {
      return NextResponse.json({ error: "Not assigned to this work order" }, { status: 403 });
    }

    const body = await req.json();
    const data = updateContractorWorkOrderSchema.parse(body);

    const updateData: any = { ...data, organizationId: ctx.organizationId };
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);
    if (data.completedDate) updateData.completedDate = new Date(data.completedDate);

    const updated = await db.workOrder.update({ where: { id }, data: updateData });

    if (data.status && data.status !== workOrder.status) {
      await db.workOrderActivity.create({
        data: {
          organizationId: ctx.organizationId,
          workOrderId: id,
          actorId: user.id,
          action: "STATUS_CHANGED",
          fromValue: workOrder.status,
          toValue: data.status,
        },
      });

      await db.maintenanceRequest.update({
        where: { id: workOrder.maintenanceRequestId },
        data: { status: data.status as any },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}