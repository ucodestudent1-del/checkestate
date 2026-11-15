import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const checks: Record<string, { status: "healthy" | "unhealthy"; latency?: number; error?: string }> = {};
  let overall: "healthy" | "unhealthy" = "healthy";

  // Database check
  const dbStart = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = { status: "healthy", latency: Date.now() - dbStart };
  } catch (error) {
    overall = "unhealthy";
    checks.database = {
      status: "unhealthy",
      latency: Date.now() - dbStart,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Environment validation
  checks.environment = {
    status: env.NODE_ENV === "production" && !env.NEXTAUTH_SECRET ? "unhealthy" : "healthy",
    error: env.NODE_ENV === "production" && !env.NEXTAUTH_SECRET ? "NEXTAUTH_SECRET not set" : undefined,
  };

  const statusCode = overall === "healthy" ? 200 : 503;
  return NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: statusCode }
  );
}
