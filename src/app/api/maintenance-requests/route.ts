import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-middleware";
import { MaintenanceRequestService } from "@/lib/services/maintenance";

const maintenanceRequestSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  unitId: z.string().optional(),
  tenantId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().optional(),
});

const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  // Note: organizationId comes from auth context in withErrorHandler
  // but we need it here - we'll get it from the session
  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;

  if (!organizationId) {
    return NextResponse.json({ error: "No organization associated" }, { status: 400 });
  }

  const result = await MaintenanceRequestService.list(organizationId, {
    status: searchParams.get("status") || undefined,
    priority: searchParams.get("priority") || undefined,
    search: searchParams.get("search") || undefined,
  }, { page, pageSize });

  return NextResponse.json(result);
});

const POST = withErrorHandler(async (req: NextRequest, { userId }) => {
  const body = await req.json();
  const data = maintenanceRequestSchema.parse(body);

  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;

  if (!organizationId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await MaintenanceRequestService.create(organizationId, userId, {
    propertyId: data.propertyId,
    unitId: data.unitId,
    tenantId: data.tenantId,
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority,
  });

  return NextResponse.json(result, { status: 201 });
});

export { GET, POST };
