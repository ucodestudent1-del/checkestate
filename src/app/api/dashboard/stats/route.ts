import { NextRequest, NextResponse } from "next/server";
import { requireOrganization } from "@/lib/session";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireOrganization();
    const organizationId = ctx.organizationId;

    const [
      totalProperties,
      totalUnits,
      openRequests,
      urgentRequests,
      awaitingApproval,
      scheduledRepairs,
      completedRepairs,
      monthlyExpenses,
      requestsByCategory,
    ] = await Promise.all([
      db.property.count({ where: { organizationId } }),
      db.unit.count({ where: { organizationId } }),
      db.maintenanceRequest.count({ where: { organizationId, status: { in: ["NEW", "UNDER_REVIEW", "AWAITING_APPROVAL", "APPROVED", "ASSIGNED", "SCHEDULED", "IN_PROGRESS", "WAITING_FOR_PARTS"] } } }),
      db.maintenanceRequest.count({ where: { organizationId, priority: { in: ["URGENT", "EMERGENCY"] }, status: { in: ["NEW", "UNDER_REVIEW", "AWAITING_APPROVAL", "APPROVED", "ASSIGNED", "SCHEDULED", "IN_PROGRESS", "WAITING_FOR_PARTS"] } } }),
      db.maintenanceRequest.count({ where: { organizationId, status: "AWAITING_APPROVAL" } }),
      db.maintenanceRequest.count({ where: { organizationId, status: "SCHEDULED" } }),
      db.maintenanceRequest.count({ where: { organizationId, status: { in: ["COMPLETED", "CLOSED"] } } }),
      db.maintenanceExpense.aggregate({
        where: {
          organizationId,
          expenseDate: {
            gte: new Date(new Date().setDate(1)),
            lt: new Date(new Date().setMonth(new Date().getMonth() + 1, 1)),
          },
        },
        _sum: { actualCost: true },
      }),
      db.maintenanceRequest.groupBy({
        by: ["category"],
        where: { organizationId },
        _count: { category: true },
      }),
    ]);

    const completedRequests = await db.maintenanceRequest.findMany({
      where: {
        organizationId,
        status: { in: ["COMPLETED", "CLOSED"] },
        completionDate: { not: null },
      },
      select: { submittedAt: true, completionDate: true },
    });

    let avgResolutionDays = 0;
    if (completedRequests.length > 0) {
      const totalDays = completedRequests.reduce((sum: number, r: { submittedAt: Date | string; completionDate: Date | string }) => {
        const diff = new Date(r.completionDate!).getTime() - new Date(r.submittedAt).getTime();
        return sum + diff / (1000 * 60 * 60 * 24);
      }, 0);
      avgResolutionDays = Math.round(totalDays / completedRequests.length * 10) / 10;
    }

    return NextResponse.json({
      totalProperties,
      totalUnits,
      openRequests,
      urgentRequests,
      awaitingApproval,
      scheduledRepairs,
      completedRepairs,
      monthlyExpenses: monthlyExpenses._sum.actualCost || 0,
      avgResolutionDays,
      requestsByCategory: requestsByCategory.map((r: { category: string; _count: { category: number } }) => ({
        category: r.category,
        count: r._count.category,
      })),
    });
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}
