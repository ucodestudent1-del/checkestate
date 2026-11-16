import { NextResponse } from "next/server";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const ctx = await requireOrganization();
    const user = await getCurrentUser();
    const organizationId = ctx.organizationId;

    // Gather all user data
    const [userData, properties, units, maintenanceRequests, workOrders, contractors, expenses, notifications] =
      await Promise.all([
        db.user.findUnique({ where: { id: user.id } }),
        db.property.findMany({ where: { organizationId } }),
        db.unit.findMany({ where: { organizationId } }),
        db.maintenanceRequest.findMany({ where: { organizationId } }),
        db.workOrder.findMany({ where: { organizationId } }),
        db.contractor.findMany({ where: { organizationId } }),
        db.maintenanceExpense.findMany({ where: { organizationId } }),
        db.notification.findMany({ where: { organizationId } }),
      ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: userData,
      organization: { id: organizationId },
      properties,
      units,
      maintenanceRequests,
      workOrders,
      contractors,
      expenses,
      notifications,
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="checkestate-data-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}