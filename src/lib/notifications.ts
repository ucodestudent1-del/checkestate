import { db } from "@/lib/db";
import { NotificationChannel, UserRole } from "@prisma/client";
import { emailTemplates, processEmailQueue } from "@/lib/email";
import { logger } from "@/lib/logger";

export interface NotificationTrigger {
  type: string;
  organizationId: string;
  userIds?: string[];
  roleFilters?: UserRole[];
  data: Record<string, any>;
}

export class NotificationService {
  static async createNotification(
    organizationId: string,
    userId: string,
    title: string,
    message: string,
    channel: NotificationChannel = "IN_APP",
    metadata: Record<string, any> = {}
  ) {
    const notification = await db.notification.create({
      data: {
        organizationId,
        userId,
        title,
        message,
        channel,
        metadata,
      },
    });

    if (channel === "EMAIL" || channel === "BOTH") {
      await this.queueEmailNotification(userId, title, message, metadata);
    }

    return notification;
  }

  static async createBulkNotifications(
    organizationId: string,
    userIds: string[],
    title: string,
    message: string,
    channel: NotificationChannel = "IN_APP",
    metadata: Record<string, any> = {}
  ) {
    const notifications = await db.notification.createMany({
      data: userIds.map((userId) => ({
        organizationId,
        userId,
        title,
        message,
        channel,
        metadata,
      })),
    });

    if (channel === "EMAIL" || channel === "BOTH") {
      const users = await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true },
      });

      for (const user of users) {
        await this.queueEmailNotification(user.id, title, message, { ...metadata, userEmail: user.email });
      }
    }

    return notifications;
  }

  private static async queueEmailNotification(
    userId: string,
    title: string,
    message: string,
    metadata: Record<string, any>
  ) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) return;

    const idempotencyKey = `notification:${userId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    await db.emailLog.create({
      data: {
        to: user.email,
        template: "notification",
        subject: title,
        status: "PENDING",
        idempotencyKey,
      },
    });
  }

  static async trigger(trigger: NotificationTrigger): Promise<void> {
    const { type, organizationId, userIds, roleFilters, data } = trigger;

    let targetUserIds: string[] = [];

    if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else if (roleFilters && roleFilters.length > 0) {
      const memberships = await db.organizationMember.findMany({
        where: {
          organizationId,
          role: { in: roleFilters },
          isActive: true,
        },
        select: { userId: true },
      });
      targetUserIds = memberships.map((m) => m.userId);
    }

    switch (type) {
      case "MAINTENANCE_REQUEST_CREATED": {
        const { requestNumber, propertyName, category, priority, propertyId } = data;
        const managers = await db.organizationMember.findMany({
          where: {
            organizationId,
            role: { in: ["PROPERTY_OWNER", "PROPERTY_MANAGER", "MAINTENANCE_STAFF"] },
            isActive: true,
          },
          select: { userId: true },
        });

        for (const manager of managers) {
          await this.createNotification(
            organizationId,
            manager.userId,
            "New Maintenance Request",
            `New ${priority} priority request ${requestNumber} for ${propertyName} (${category})`,
            "BOTH",
            { requestNumber, propertyName, category, priority, propertyId }
          );
        }

        if (data.tenantId) {
          const tenant = await db.tenant.findUnique({ where: { id: data.tenantId }, select: { userId: true } });
          if (tenant) {
            await this.createNotification(
              organizationId,
              tenant.userId,
              "Request Submitted",
              `Your maintenance request ${requestNumber} has been submitted for ${propertyName}.`,
              "IN_APP",
              { requestNumber, propertyName }
            );
          }
        }
        break;
      }

      case "WORK_ORDER_STATUS_CHANGED": {
        const { workOrderNumber, status, propertyName, scheduledDate, maintenanceRequestId } = data;

        if (data.assignedContractorId) {
          const contractor = await db.contractor.findUnique({
            where: { id: data.assignedContractorId },
            select: { userId: true, email: true },
          });

          if (contractor?.userId) {
            await this.createNotification(
              organizationId,
              contractor.userId,
              `Work Order ${workOrderNumber} Status Update`,
              `Work order status changed to ${status.replace(/_/g, " ")} for ${propertyName}`,
              "BOTH",
              { workOrderNumber, status, propertyName, scheduledDate }
            );
          }
        }

        if (maintenanceRequestId) {
          const request = await db.maintenanceRequest.findUnique({
            where: { id: maintenanceRequestId },
            include: { tenant: { select: { userId: true } } },
          });

          if (request?.tenant?.userId) {
            await this.createNotification(
              organizationId,
              request.tenant.userId,
              `Work Order Update: ${workOrderNumber}`,
              `Your request status changed to ${status.replace(/_/g, " ")}`,
              "BOTH",
              { workOrderNumber, status, propertyName, scheduledDate }
            );
          }
        }
        break;
      }

      case "CONTRACTOR_ASSIGNED": {
        const { workOrderNumber, title, propertyName, scheduledDate, contractorId } = data;
        const contractor = await db.contractor.findUnique({
          where: { id: contractorId },
          select: { userId: true, email: true, name: true },
        });

        if (contractor?.userId) {
          await this.createNotification(
            organizationId,
            contractor.userId,
            `New Work Order Assigned: ${workOrderNumber}`,
            `You have been assigned to ${title} at ${propertyName}`,
            "BOTH",
            { workOrderNumber, title, propertyName, scheduledDate }
          );
        }
        break;
      }

      case "PAYMENT_SUCCEEDED": {
        const { planName, amount, period } = data;
        const owner = await db.organizationMember.findFirst({
          where: { organizationId, isOwner: true, isActive: true },
          select: { userId: true },
        });

        if (owner) {
          await this.createNotification(
            organizationId,
            owner.userId,
            "Payment Successful",
            `Your ${planName} plan payment of $${amount} (${period}) was processed successfully.`,
            "BOTH",
            { planName, amount, period }
          );
        }
        break;
      }

      case "PAYMENT_FAILED": {
        const { planName, retryUrl } = data;
        const owner = await db.organizationMember.findFirst({
          where: { organizationId, isOwner: true, isActive: true },
          select: { userId: true },
        });

        if (owner) {
          await this.createNotification(
            organizationId,
            owner.userId,
            "Payment Failed - Action Required",
            `Your ${planName} plan payment failed. Please update your payment method.`,
            "BOTH",
            { planName, retryUrl }
          );
        }
        break;
      }

      case "DOCUMENT_EXPIRING": {
        const { contractorName, documentType, expiryDate } = data;
        const managers = await db.organizationMember.findMany({
          where: {
            organizationId,
            role: { in: ["PROPERTY_OWNER", "PROPERTY_MANAGER"] },
            isActive: true,
          },
          select: { userId: true },
        });

        for (const manager of managers) {
          await this.createNotification(
            organizationId,
            manager.userId,
            `Document Expiring: ${documentType}`,
            `${contractorName}'s ${documentType} expires on ${new Date(expiryDate).toLocaleDateString()}`,
            "IN_APP",
            { contractorName, documentType, expiryDate }
          );
        }
        break;
      }

      case "MAINTENANCE_OVERDUE": {
        const { requestNumber, propertyName, daysOverdue, priority } = data;
        const managers = await db.organizationMember.findMany({
          where: {
            organizationId,
            role: { in: ["PROPERTY_OWNER", "PROPERTY_MANAGER", "MAINTENANCE_STAFF"] },
            isActive: true,
          },
          select: { userId: true },
        });

        for (const manager of managers) {
          await this.createNotification(
            organizationId,
            manager.userId,
            `Overdue Maintenance Request: ${requestNumber}`,
            `Request ${requestNumber} at ${propertyName} is ${daysOverdue} days overdue (${priority} priority)`,
            "BOTH",
            { requestNumber, propertyName, daysOverdue, priority }
          );
        }
        break;
      }

      case "TENANT_INVITED": {
        const { email, propertyName, unitNumber } = data;
        await this.createNotification(
          organizationId,
          "system",
          "Tenant Invited",
          `${email} has been invited to ${propertyName}${unitNumber ? ` (Unit ${unitNumber})` : ""}`,
          "IN_APP",
          { email, propertyName, unitNumber }
        );
        break;
      }

      case "SUBSCRIPTION_CHANGED": {
        const { planName, oldPlan, newStatus } = data;
        const owner = await db.organizationMember.findFirst({
          where: { organizationId, isOwner: true, isActive: true },
          select: { userId: true },
        });

        if (owner) {
          await this.createNotification(
            organizationId,
            owner.userId,
            "Subscription Updated",
            `Your subscription changed from ${oldPlan} to ${planName} (${newStatus})`,
            "IN_APP",
            { planName, oldPlan, newStatus }
          );
        }
        break;
      }

      default:
        logger.warn("Unknown notification trigger type", { type });
    }
  }

  static async processEmailQueue(limit = 50): Promise<number> {
    return processEmailQueue(limit);
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return db.notification.count({
      where: { userId, isRead: false },
    });
  }

  static async markAsRead(userId: string, notificationIds: string[]): Promise<void> {
    await db.notification.updateMany({
      where: { id: { in: notificationIds }, userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}

export async function runNotificationWorkers(): Promise<void> {
  logger.info("Starting notification workers");

  await NotificationService.processEmailQueue(100);

  const overdueRequests = await db.maintenanceRequest.findMany({
    where: {
      status: { in: ["NEW", "UNDER_REVIEW", "AWAITING_APPROVAL", "APPROVED", "ASSIGNED", "SCHEDULED", "IN_PROGRESS", "WAITING_FOR_PARTS"] },
      submittedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    include: { organization: true },
  });

  for (const request of overdueRequests) {
    const daysOverdue = Math.floor((Date.now() - request.submittedAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysOverdue >= 7 && daysOverdue % 7 === 0) {
      await NotificationService.trigger({
        type: "MAINTENANCE_OVERDUE",
        organizationId: request.organizationId,
        data: {
          requestNumber: request.requestNumber,
          propertyName: request.property?.name || "Unknown Property",
          daysOverdue,
          priority: request.priority,
        },
      });
    }
  }

  const expiringDocuments = await db.contractorDocument.findMany({
    where: {
      expiresAt: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), gte: new Date() },
    },
    include: { contractor: { include: { organization: true } } },
  });

  for (const doc of expiringDocuments) {
    const daysUntilExpiry = Math.floor((doc.expiresAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry % 7 === 0 || daysUntilExpiry <= 3) {
      await NotificationService.trigger({
        type: "DOCUMENT_EXPIRING",
        organizationId: doc.contractor.organizationId,
        data: {
          contractorName: doc.contractor.name,
          documentType: doc.documentType,
          expiryDate: doc.expiresAt!.toISOString(),
        },
      });
    }
  }

  logger.info("Notification workers completed");
}

setInterval(runNotificationWorkers, 60 * 60 * 1000).unref();