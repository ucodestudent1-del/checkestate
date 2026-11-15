import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-middleware";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

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
    return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
  }

  const { id } = await params;

  const workOrder = await db.workOrder.findFirst({
    where: { id, organizationId: ctx.organizationId, deletedAt: null },
    include: {
      maintenanceRequest: { include: { property: true, unit: true, tenant: true } },
      assignedTo: true,
      assignments: { where: { contractorId: contractor.id }, include: { contractor: true } },
      comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" } },
      attachments: true,
    },
  });

  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  const isAssigned = workOrder.assignments.some((a) => a.contractorId === contractor.id);
  if (!isAssigned) {
    return NextResponse.json({ error: "Not assigned to this work order" }, { status: 403 });
  }

  return NextResponse.json(workOrder);
});

export { GET };