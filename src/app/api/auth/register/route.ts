import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(1, "Organization name is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const result = await db.$transaction(async (tx: any) => {
      const organization = await tx.organization.create({
        data: {
          name: data.organizationName,
          slug: data.organizationName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, ""),
          planType: "STARTER",
          subscriptionStatus: "TRIALING",
          unitLimit: 10,
          aiUsageLimit: 0,
          aiUsageCount: 0,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: "PROPERTY_OWNER",
          isActive: true,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: "PROPERTY_OWNER",
          isOwner: true,
          invitedAt: new Date(),
          joinedAt: new Date(),
          isActive: true,
        },
      });

      return { user, organization };
    });

    return NextResponse.json(
      { message: "Registration successful", user: { id: result.user.id, email: result.user.email } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
