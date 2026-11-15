import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const validateSchema = z.object({
  token: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false, error: "Token required" }, { status: 400 });
    }

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ valid: false, error: "Invalid token" }, { status: 404 });
    }

    if (resetToken.expires < new Date()) {
      await db.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ valid: false, error: "Token expired" }, { status: 400 });
    }

    const isTokenValid = await bcrypt.compare(token, resetToken.token);
    if (!isTokenValid) {
      return NextResponse.json({ valid: false, error: "Invalid token" }, { status: 404 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Validate reset token error:", error);
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 });
  }
}
