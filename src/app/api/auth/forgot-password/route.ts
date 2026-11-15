import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { RateLimitError } from "@/lib/errors";

const forgotSchema = z.object({
  email: z.string().email(),
});

// Simple in-memory rate limiter for password reset (1 per 15 min per IP)
const resetRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RESET_RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RESET_RATE_LIMIT_MAX = 3;

function rateLimit(identifier: string): { allowed: boolean } {
  const now = Date.now();
  const record = resetRateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    resetRateLimitMap.set(identifier, { count: 1, resetTime: now + RESET_RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= RESET_RATE_LIMIT_MAX) {
    return { allowed: false };
  }

  record.count++;
  return { allowed: true };
}

export async function POST(req: NextRequest) {
  try {
    const ip = (req as any).ip ?? req.headers.get("x-forwarded-for") ?? "unknown";
    const { allowed } = rateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const body = await req.json();
    const { email } = forgotSchema.parse(body);

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ message: "If the email exists, a reset link has been sent" });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(rawToken, 12);
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.passwordResetToken.upsert({
      where: { token: rawToken },
      create: {
        userId: user.id,
        token: tokenHash,
        expires,
      },
      update: {
        token: tokenHash,
        expires,
      },
    });

    await sendPasswordResetEmail(email, rawToken);

    return NextResponse.json({ message: "If the email exists, a reset link has been sent" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
