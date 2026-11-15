import { db } from "@/lib/db";
import { AppError, NotFoundError, ForbiddenError, ValidationError } from "@/lib/errors";

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

    const where: any = { organizationId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
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
    const count = await db.maintenanceRequest.count({ where: { organizationId } });
    const requestNumber = `WR-${String(count + 1).padStart(4, "0")}`;

    return await db.$transaction(async (tx) => {
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
          category: data.category as any,
          priority: (data.priority as any) || "MEDIUM",
          status: "NEW",
        },
      });

      await tx.workOrder.create({
        data: {
          organizationId,
          maintenanceRequestId: request.id,
          workOrderNumber: `WO-${String(count + 1).padStart(4, "0")}`,
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

    const where: any = { organizationId };
    if (status) where.status = status;
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

    const updateData: any = { ...data };
    if (data.scheduledDate) updateData.scheduledDate = new Date(data.scheduledDate);
    if (data.completedDate) updateData.completedDate = new Date(data.completedDate);

    const updated = await db.workOrder.update({ where: { id }, data: updateData });

    if (data.status && data.status !== workOrder.status) {
      await db.workOrderActivity.create({
        data: {
          organizationId,
          workOrderId: id,
          actorId: userId,
          action: "STATUS_CHANGED",
          fromValue: workOrder.status,
          toValue: data.status,
        },
      });
      await db.maintenanceRequest.update({
        where: { id: workOrder.maintenanceRequestId },
        data: { status: data.status as any },
      });
    }

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
