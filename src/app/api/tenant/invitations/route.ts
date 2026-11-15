import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { handleApiError } from "@/lib/errors";

const validateSchema = z.object({
  token: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const invitation = await db.tenantInvitation.findUnique({
      where: { token },
      include: { unit: { include: { property: true } } },
    });

    if (!invitation || !invitation.isActive) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation expired" }, { status: 400 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      unit: invitation.unit
        ? {
            id: invitation.unit.id,
            unitNumber: invitation.unit.unitNumber,
            property: invitation.unit.property.name,
          }
        : null,
    });
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}

const acceptSchema = z.object({
  token: z.string().min(1),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = acceptSchema.parse(body);

    const invitation = await db.tenantInvitation.findUnique({
      where: { token: data.token },
      include: { unit: true },
    });

    if (!invitation || !invitation.isActive) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation expired" }, { status: 400 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: "TENANT",
          isActive: true,
        },
      });

      await tx.tenant.update({
        where: { id: invitation.unitId! },
        data: {
          userId: user.id,
        },
      });

      await tx.tenantInvitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt: new Date(),
          isActive: false,
        },
      });
    });

    return NextResponse.json({ message: "Account created successfully" }, { status: 201 });
  } catch (err) {
    const { error, statusCode, issues } = handleApiError(err);
    return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: statusCode });
  }
}
