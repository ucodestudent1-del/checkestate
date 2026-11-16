import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where: any = { organizationId };
    if (unreadOnly) where.isRead = false;

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.notification.count({ where }),
    ]);

    return NextResponse.json({ data: notifications, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}

const notificationSchema = z.object({
  userId: z.string(),
  title: z.string().min(1),
  message: z.string().min(1),
  channel: z.string().optional(),
  metadata: z.any().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const body = await req.json();
    const data = notificationSchema.parse(body);

    const notification = await db.notification.create({
      data: {
        organizationId,
        userId: data.userId,
        title: data.title,
        message: data.message,
        channel: (data.channel as any) || "IN_APP",
        metadata: data.metadata || {},
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Notification ID required" }, { status: 400 });

    const notification = await db.notification.update({
      where: { id, organizationId },
      data: { isRead: true, readAt: new Date() },
    });
    return NextResponse.json(notification);
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}
