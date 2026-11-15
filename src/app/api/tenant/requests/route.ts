import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

const requestSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  unitId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireOrganization();
    const user = await getCurrentUser();
    
    if (user.role !== "TENANT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const tenant = await db.tenant.findFirst({
      where: { userId: user.id, organizationId: ctx.organizationId },
    });

    if (!tenant) {
      return NextResponse.json({ data: [], total: 0, page, pageSize, totalPages: 0 });
    }

    const where = {
      organizationId: ctx.organizationId,
      tenantId: tenant.id,
    };

    const [requests, total] = await Promise.all([
      db.maintenanceRequest.findMany({
        where,
        include: { property: true, unit: true, assignedContractor: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.maintenanceRequest.count({ where }),
    ]);

    return NextResponse.json({ data: requests, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireOrganization();
    const user = await getCurrentUser();
    
    if (user.role !== "TENANT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenant = await db.tenant.findFirst({
      where: { userId: user.id, organizationId: ctx.organizationId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "No tenant profile found" }, { status: 400 });
    }

    const body = await req.json();
    const data = requestSchema.parse(body);

    const property = await db.property.findFirst({
      where: { id: data.propertyId, organizationId: ctx.organizationId },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (data.unitId) {
      const unit = await db.unit.findFirst({
        where: { id: data.unitId, propertyId: data.propertyId, organizationId: ctx.organizationId },
      });
      if (!unit) {
        return NextResponse.json({ error: "Unit not found" }, { status: 404 });
      }
      if (unit.tenantId !== tenant.id) {
        return NextResponse.json({ error: "Unit not assigned to you" }, { status: 403 });
      }
    } else if (tenant.unitId) {
      data.unitId = tenant.unitId;
    }

    const count = await db.maintenanceRequest.count({ where: { organizationId: ctx.organizationId } });
    const requestNumber = `WR-${String(count + 1).padStart(4, "0")}`;

    const result = await db.$transaction(async (tx) => {
      const request = await tx.maintenanceRequest.create({
        data: {
          organizationId: ctx.organizationId,
          requestNumber,
          propertyId: data.propertyId,
          unitId: data.unitId || null,
          tenantId: tenant.id,
          submittedById: user.id,
          title: data.title,
          description: data.description,
          category: data.category as any,
          priority: (data.priority as any) || "MEDIUM",
          status: "NEW",
        },
      });

      await tx.workOrder.create({
        data: {
          organizationId: ctx.organizationId,
          maintenanceRequestId: request.id,
          workOrderNumber: `WO-${String(count + 1).padStart(4, "0")}`,
          title: data.title,
          description: data.description,
          status: "NEW",
        },
      });

      await tx.workOrderActivity.create({
        data: {
          organizationId: ctx.organizationId,
          workOrderId: request.id,
          actorId: user.id,
          action: "CREATED",
          toValue: "NEW",
        },
      });

      return request;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}