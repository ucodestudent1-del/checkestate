import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-middleware";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";
import { NotificationService } from "@/lib/notifications";

const addCommentSchema = z.object({
  comment: z.string().min(1, "Comment is required"),
  isInternal: z.boolean().default(false),
});

const POST = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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

  const { id } = await params;

  const workOrder = await db.workOrder.findFirst({
    where: { id, organizationId: ctx.organizationId, deletedAt: null },
    include: { assignments: { where: { contractorId: contractor.id } } },
  });

  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  const isAssigned = workOrder.assignments.some((a) => a.contractorId === contractor.id);
  if (!isAssigned) {
    return NextResponse.json({ error: "Not assigned to this work order" }, { status: 403 });
  }

  const body = await req.json();
  const data = addCommentSchema.parse(body);

  const comment = await db.workOrderComment.create({
    data: {
      organizationId: ctx.organizationId,
      workOrderId: id,
      authorId: user.id,
      comment: data.comment,
      isInternal: data.isInternal,
    },
    include: { author: true },
  });

  await NotificationService.trigger({
    type: "WORK_ORDER_STATUS_CHANGED",
    organizationId: ctx.organizationId,
    data: {
      workOrderNumber: workOrder.workOrderNumber,
      status: workOrder.status,
      propertyName: workOrder.maintenanceRequest?.property?.name || "Unknown Property",
      maintenanceRequestId: workOrder.maintenanceRequestId,
    },
  });

  return NextResponse.json(comment, { status: 201 });
});

const GET = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const ctx = await requireOrganization();
  const user = await getCurrentUser();

  if (user.role !== "CONTRACTOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const contractor = await db.contractor.findFirst({
    where: { email: user.email, organizationId: ctx.organizationId },
  });

  if (!contractor) {
    return NextResponse.json({ data: [] });
  }

  const { id } = await params;

  const workOrder = await db.workOrder.findFirst({
    where: { id, organizationId: ctx.organizationId, deletedAt: null },
    include: { assignments: { where: { contractorId: contractor.id } } },
  });

  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  const isAssigned = workOrder.assignments.some((a) => a.contractorId === contractor.id);
  if (!isAssigned) {
    return NextResponse.json({ error: "Not assigned to this work order" }, { status: 403 });
  }

  const comments = await db.workOrderComment.findMany({
    where: { workOrderId: id, isInternal: false },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: comments });
});

export { GET, POST };