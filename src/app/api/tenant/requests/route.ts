import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization, getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { MaintenanceRequestService } from "@/lib/services/maintenance";
import { handleApiError } from "@/lib/errors";

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

    const result = await MaintenanceRequestService.list(ctx.organizationId, where, { page, pageSize });

    return NextResponse.json(result);
  } catch (error) {
    const { error: errorMessage, statusCode, issues } = handleApiError(error);
    return NextResponse.json({ error: errorMessage, ...(issues ? { issues } : {}) }, { status: statusCode });
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

    const request = await MaintenanceRequestService.create(ctx.organizationId, user.id, {
      propertyId: data.propertyId,
      unitId: data.unitId || null,
      tenantId: tenant.id,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    const { error: errorMessage, statusCode, issues } = handleApiError(error);
    return NextResponse.json({ error: errorMessage, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}