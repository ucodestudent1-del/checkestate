import { db, Prisma } from "@/lib/db";
import { AppError, NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";
import { logCreate, logUpdate, logStatusChange } from "@/lib/audit";
import { MaintenanceCategory, Priority, WorkOrderStatus } from "@prisma/client";

const WORK_ORDER_MANAGEMENT_ROLES = ["PROPERTY_OWNER", "PROPERTY_MANAGER", "MAINTENANCE_STAFF", "SUPER_ADMIN"];

async function assertCanManageWorkOrders(userId: string, organizationId: string, workOrderId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        where: { organizationId, isActive: true },
        include: { organization: true },
      },
      workOrderAssignments: {
        where: { workOrderId },
        include: { contractor: true },
      },
    },
  });

  if (!user) {
    throw new ForbiddenError("User not found");
  }

  const membership = user.memberships[0];
  const isContractorAssigned = user.workOrderAssignments.length > 0;

  const hasManagementRole = membership && WORK_ORDER_MANAGEMENT_ROLES.includes(membership.role);
  const isOrgOwner = membership?.isOwner === true;
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  if (!isSuperAdmin && !isOrgOwner && !hasManagementRole && !isContractorAssigned) {
    throw new ForbiddenError("Insufficient permissions to update work order");
  }

  // Contractors can only update status to specific values
  if (isContractorAssigned && !hasManagementRole && !isOrgOwner && !isSuperAdmin) {
    const allowedContractorStatuses = ["IN_PROGRESS", "WAITING_FOR_PARTS", "COMPLETED"];
    // This will be checked by the caller for status changes
  }

  return { membership, isContractorAssigned, isOrgOwner, isSuperAdmin };
}

export interface MaintenanceRequestFilters {
  status?: string;
  priority?: string;
  search?: string;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  category?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export class MaintenanceRequestService {
  static async list(
    organizationId: string,
    filters: MaintenanceRequestFilters = {},
    pagination: PaginationParams = {}
  ) {
    const { page = 1, pageSize = 10 } = pagination;
    const { status, priority, search, propertyId, unitId, tenantId, category } = filters;

    const where: Prisma.MaintenanceRequestWhereInput = { organizationId, deletedAt: null };
    if (status) where.status = status as WorkOrderStatus;
    if (priority) where.priority = priority as Priority;
    if (category) where.category = category as MaintenanceCategory;
    if (propertyId) where.propertyId = propertyId;
    if (unitId) where.unitId = unitId;
    if (tenantId) where.tenantId = tenantId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { requestNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [requests, total] = await Promise.all([
      db.maintenanceRequest.findMany({
        where,
        include: { property: true, unit: true, tenant: true, assignedContractor: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.maintenanceRequest.count({ where }),
    ]);

    return {
      data: requests,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async create(
    organizationId: string,
    userId: string,
    data: {
      propertyId: string;
      unitId?: string;
      tenantId?: string;
      title: string;
      description: string;
      category: string;
      priority?: string;
    }
  ) {
    return await db.$transaction(async (tx) => {
      const org = await tx.organization.update({
        where: { id: organizationId },
        data: { maintenanceRequestSequence: { increment: 1 } },
        select: { maintenanceRequestSequence: true },
      });

      const requestNumber = `WR-${String(org.maintenanceRequestSequence).padStart(4, "0")}`;

      const request = await tx.maintenanceRequest.create({
        data: {
          organizationId,
          requestNumber,
          propertyId: data.propertyId,
          unitId: data.unitId || null,
          tenantId: data.tenantId || null,
          submittedById: userId,
          title: data.title,
          description: data.description,
          category: data.category as MaintenanceCategory,
          priority: (data.priority as Priority) || "MEDIUM",
          status: "NEW" as WorkOrderStatus,
        },
      });

      await tx.workOrder.create({
        data: {
          organizationId,
          maintenanceRequestId: request.id,
          workOrderNumber: `WO-${String(org.maintenanceRequestSequence).padStart(4, "0")}`,
          title: data.title,
          description: data.description,
          status: "NEW",
        },
      });

      await tx.workOrderActivity.create({
        data: {
          organizationId,
          workOrderId: request.id,
          actorId: userId,
          action: "CREATED",
          toValue: "NEW",
        },
      });

      // Audit log for maintenance request creation
      await tx.auditLog.create({
        data: {
          organizationId,
          userId,
          action: "CREATE",
          entityType: "MaintenanceRequest",
          entityId: request.id,
          newValues: {
            requestNumber,
            propertyId: data.propertyId,
            unitId: data.unitId,
            tenantId: data.tenantId,
            title: data.title,
            category: data.category,
            priority: data.priority || "MEDIUM",
            status: "NEW",
          },
        },
      });

      // Audit log for work order creation
      const workOrder = await tx.workOrder.findUnique({ where: { maintenanceRequestId: request.id } });
      if (workOrder) {
        await tx.auditLog.create({
          data: {
            organizationId,
            userId,
            action: "CREATE",
            entityType: "WorkOrder",
            entityId: workOrder.id,
            newValues: {
              workOrderNumber: workOrder.workOrderNumber,
              maintenanceRequestId: request.id,
              title: data.title,
              status: "NEW",
            },
          },
        });
      }

      return request;
    });
  }

  static async getById(id: string, organizationId: string) {
    const request = await db.maintenanceRequest.findFirst({
      where: { id, organizationId },
      include: { property: true, unit: true, tenant: true, assignedContractor: true },
    });

    if (!request) {
      throw new NotFoundError("Maintenance request not found");
    }

    return request;
  }
}

export class WorkOrderService {
  static async list(
    organizationId: string,
    filters: { status?: string; search?: string } = {},
    pagination: PaginationParams = {}
  ) {
    const { page = 1, pageSize = 10 } = pagination;
    const { status, search } = filters;

    const where: Prisma.WorkOrderWhereInput = { organizationId, deletedAt: null };
    if (status) where.status = status as WorkOrderStatus;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { workOrderNumber: { contains: search, mode: "insensitive" } },
        { maintenanceRequest: { title: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [workOrders, total] = await Promise.all([
      db.workOrder.findMany({
        where,
        include: {
          maintenanceRequest: { include: { property: true, unit: true, tenant: true } },
          assignedTo: true,
          assignments: { include: { contractor: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.workOrder.count({ where }),
    ]);

    return {
      data: workOrders,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  static async getById(id: string, organizationId: string) {
    const workOrder = await db.workOrder.findFirst({
      where: { id, organizationId },
      include: {
        maintenanceRequest: { include: { property: true, unit: true, tenant: true } },
        assignedTo: true,
        assignments: { include: { contractor: true } },
        comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
        activities: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!workOrder) {
      throw new NotFoundError("Work order not found");
    }

    return workOrder;
  }

  static async update(
    id: string,
    organizationId: string,
    userId: string,
    data: {
      status?: string;
      assignedToId?: string;
      scheduledDate?: string;
      completedDate?: string;
      description?: string;
    }
  ) {
    const workOrder = await db.workOrder.findFirst({ where: { id, organizationId } });
    if (!workOrder) {
      throw new NotFoundError("Work order not found");
    }

    // Check permissions
    const { isContractorAssigned, isOrgOwner, isSuperAdmin, membership } = await assertCanManageWorkOrders(userId, organizationId, id);

    // Contractors can only update status, not reassign or schedule
    if (isContractorAssigned && !isOrgOwner && !isSuperAdmin && !membership) {
      const allowedFields = ["status"];
      const requestedFields = Object.keys(data);
      const hasDisallowedFields = requestedFields.some(f => !allowedFields.includes(f));
      if (hasDisallowedFields) {
        throw new ForbiddenError("Contractors can only update work order status");
      }

      // Contractors can only transition to specific statuses
      if (data.status) {
        const allowedContractorStatuses = ["IN_PROGRESS", "WAITING_FOR_PARTS", "COMPLETED"];
        if (!allowedContractorStatuses.includes(data.status)) {
          throw new ForbiddenError(`Contractors cannot set status to ${data.status}`);
        }
      }
    }

    const updateData: Prisma.WorkOrderUpdateInput = { ...data };
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);
    if (data.completedDate) updateData.completedDate = new Date(data.completedDate);

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.workOrder.update({ where: { id }, data: updateData });

      // Audit log for work order update
      const oldValues: Record<string, unknown> = {};
      const newValues: Record<string, unknown> = {};

      if (data.status && data.status !== workOrder.status) {
        oldValues.status = workOrder.status;
        newValues.status = data.status;

        await tx.workOrderActivity.create({
          data: {
            organizationId,
            workOrderId: id,
            actorId: userId,
            action: "STATUS_CHANGED",
            fromValue: workOrder.status,
            toValue: data.status,
          },
        });

        await tx.maintenanceRequest.update({
          where: { id: workOrder.maintenanceRequestId },
          data: { status: data.status as WorkOrderStatus },
        });

        // Audit log for maintenance request status change
        await tx.auditLog.create({
          data: {
            organizationId,
            userId,
            action: "STATUS_CHANGE",
            entityType: "MaintenanceRequest",
            entityId: workOrder.maintenanceRequestId,
            oldValues: { status: workOrder.status },
            newValues: { status: data.status },
          },
        });
      }

      if (data.assignedToId && data.assignedToId !== workOrder.assignedToId) {
        oldValues.assignedToId = workOrder.assignedToId;
        newValues.assignedToId = data.assignedToId;
      }

      if (data.scheduledDate) {
        oldValues.scheduledDate = workOrder.scheduledDate;
        newValues.scheduledDate = data.scheduledDate;
      }

      if (data.completedDate) {
        oldValues.completedDate = workOrder.completedDate;
        newValues.completedDate = data.completedDate;
      }

      if (data.description && data.description !== workOrder.description) {
        oldValues.description = workOrder.description;
        newValues.description = data.description;
      }

      if (Object.keys(newValues).length > 0) {
        await tx.auditLog.create({
          data: {
            organizationId,
            userId,
            action: "UPDATE",
            entityType: "WorkOrder",
            entityId: id,
            oldValues,
            newValues,
          },
        });
      }

      return result;
    });

    return updated;
  }
}

export class OrganizationService {
  static async checkPropertyLimit(organizationId: string) {
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: {
        unitLimit: true,
        _count: { select: { properties: true } },
      },
    });

    if (!org) {
      throw new NotFoundError("Organization not found");
    }

    return {
      canAdd: org._count.properties < org.unitLimit,
      current: org._count.properties,
      limit: org.unitLimit,
    };
  }
}
