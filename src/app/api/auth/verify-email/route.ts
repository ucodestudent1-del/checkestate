import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

const verifySchema = z.object({
  token: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/auth/login?error=missing_token", req.url));
    }

    const verificationToken = await db.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(new URL("/auth/login?error=invalid_token", req.url));
    }

    if (verificationToken.expires < new Date()) {
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(new URL("/auth/login?error=expired_token", req.url));
    }

    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/auth/login?error=user_not_found", req.url));
    }

    if (user.emailVerified) {
      await db.verificationToken.delete({ where: { token } });
      return NextResponse.redirect(new URL("/auth/login?verified=true", req.url));
    }

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
      await tx.verificationToken.delete({ where: { token } });
    });

    return NextResponse.redirect(new URL("/auth/login?verified=true", req.url));
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(new URL("/auth/login?error=server_error", req.url));
  }
}

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = resendSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || user.emailVerified) {
      return NextResponse.json({ message: "If the email exists, a verification link has been sent" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.verificationToken.upsert({
      where: { token },
      create: {
        identifier: email,
        token,
        expires,
      },
      update: {
        token,
        expires,
      },
    });

    await sendVerificationEmail(email, token);

    return NextResponse.json({ message: "Verification email sent" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}