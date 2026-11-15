import { db } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export interface AuditLogParams {
  organizationId?: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValues: params.oldValues || {},
        newValues: params.newValues || {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break the main operation
    console.error("Failed to create audit log:", error);
  }
}

export async function logCreate(
  organizationId: string | undefined,
  userId: string | undefined,
  entityType: string,
  entityId: string,
  newValues: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog({
    organizationId,
    userId,
    action: "CREATE",
    entityType,
    entityId,
    newValues,
    ipAddress,
    userAgent,
  });
}

export async function logUpdate(
  organizationId: string | undefined,
  userId: string | undefined,
  entityType: string,
  entityId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog({
    organizationId,
    userId,
    action: "UPDATE",
    entityType,
    entityId,
    oldValues,
    newValues,
    ipAddress,
    userAgent,
  });
}

export async function logDelete(
  organizationId: string | undefined,
  userId: string | undefined,
  entityType: string,
  entityId: string,
  oldValues: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog({
    organizationId,
    userId,
    action: "DELETE",
    entityType,
    entityId,
    oldValues,
    ipAddress,
    userAgent,
  });
}

export async function logStatusChange(
  organizationId: string | undefined,
  userId: string | undefined,
  entityType: string,
  entityId: string,
  fromStatus: string,
  toStatus: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog({
    organizationId,
    userId,
    action: "STATUS_CHANGE",
    entityType,
    entityId,
    oldValues: { status: fromStatus },
    newValues: { status: toStatus },
    ipAddress,
    userAgent,
  });
}