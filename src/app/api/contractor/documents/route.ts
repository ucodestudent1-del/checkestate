import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api-middleware";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { z } from "zod";

const GET = withErrorHandler(async (req: NextRequest) => {
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

  const documents = await db.contractorDocument.findMany({
    where: { contractorId: contractor.id, deletedAt: null },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({ data: documents });
});

const uploadSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  documentType: z.string().min(1),
  expiresAt: z.string().optional(),
});

const POST = withErrorHandler(async (req: NextRequest) => {
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

  const body = await req.json();
  const data = uploadSchema.parse(body);

  const document = await db.contractorDocument.create({
    data: {
      contractorId: contractor.id,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      documentType: data.documentType,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });

  return NextResponse.json(document, { status: 201 });
});

export { GET, POST };