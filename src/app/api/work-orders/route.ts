import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/api-middleware";
import { WorkOrderService } from "@/lib/services/maintenance";

const updateWorkOrderSchema = z.object({
  status: z.string().optional(),
  assignedToId: z.string().optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional(),
  description: z.string().optional(),
});

const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;

  if (!organizationId) {
    return NextResponse.json({ error: "No organization associated" }, { status: 400 });
  }

  const result = await WorkOrderService.list(organizationId, {
    status: searchParams.get("status") || undefined,
    search: searchParams.get("search") || undefined,
  }, { page, pageSize });

  return NextResponse.json(result);
});

const PATCH = withErrorHandler(async (req: NextRequest, { userId }) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Work order ID required" }, { status: 400 });
  }

  const body = await req.json();
  const data = updateWorkOrderSchema.parse(body);

  const { auth } = await import("@/lib/auth");
  const session = await auth();
  const organizationId = (session?.user as any)?.organizationId;

  if (!organizationId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updated = await WorkOrderService.update(id, organizationId, userId, data);

  return NextResponse.json(updated);
});

export { GET, PATCH };
