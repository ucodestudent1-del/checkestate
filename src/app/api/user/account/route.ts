import { NextResponse } from "next/server";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function DELETE(req: Request) {
  try {
    const ctx = await requireOrganization();
    const user = await getCurrentUser();
    const organizationId = ctx.organizationId;

    // Delete all user data in a transaction
    await db.$transaction(async (tx) => {
      // Delete attachments first
      await tx.attachment.deleteMany({ where: { organizationId } });
      // Delete maintenance expenses
      await tx.maintenanceExpense.deleteMany({ where: { organizationId } });
      // Delete work order activities
      await tx.workOrderActivity.deleteMany({ where: { organizationId } });
      // Delete work order assignments
      await tx.workOrderAssignment.deleteMany({ where: { organizationId } });
      // Delete work order comments
      await tx.workOrderComment.deleteMany({ where: { organizationId } });
      // Delete work orders
      await tx.workOrder.deleteMany({ where: { organizationId } });
      // Delete maintenance requests
      await db.maintenanceRequest.deleteMany({ where: { organizationId } });
      // Delete contractor documents
      await db.contractorDocument.deleteMany({ where: { organizationId } });
      // Delete contractors
      await db.contractor.deleteMany({ where: { organizationId } });
      // Delete units
      await db.unit.deleteMany({ where: { organizationId } });
      // Delete properties
      await db.property.deleteMany({ where: { organizationId } });
      // Delete notifications
      await db.notification.deleteMany({ where: { organizationId } });
      // Delete notifications for users in org
      await db.notification.deleteMany({ where: { userId: { in: [] } } });
      // Delete organization members
      await db.organizationMember.deleteMany({ where: { organizationId } });
      // Delete organization
      await db.organization.delete({ where: { id: organizationId } });
      // Delete user
      await db.user.delete({ where: { id: user.id } });
    });

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}