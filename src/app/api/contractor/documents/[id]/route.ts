import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-middleware";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const DELETE = withErrorHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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

  const document = await db.contractorDocument.findFirst({
    where: { id, contractorId: contractor.id, deletedAt: null },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await db.contractorDocument.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ message: "Document deleted" });
});

export { DELETE };