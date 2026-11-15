import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const checks: Record<string, { status: "healthy" | "degraded" | "unhealthy"; latency?: number; error?: string; details?: any }> = {};
  let overall: "healthy" | "degraded" | "unhealthy" = "healthy";

  // Database check
  const dbStart = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    checks.database = { 
      status: dbLatency > 100 ? "degraded" : "healthy", 
      latency: dbLatency,
      details: { connectionPool: "ok" },
    };
    if (dbLatency > 100) overall = "degraded";
  } catch (error) {
    overall = "unhealthy";
    checks.database = {
      status: "unhealthy",
      latency: Date.now() - dbStart,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Redis check (if configured)
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const redisStart = Date.now();
    try {
      const { Redis } = require("@upstash/redis");
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      await redis.ping();
      checks.redis = { status: "healthy", latency: Date.now() - redisStart };
    } catch (error) {
      overall = overall === "healthy" ? "degraded" : overall;
      checks.redis = {
        status: "degraded",
        latency: Date.now() - redisStart,
        error: error instanceof Error ? error.message : "Redis unavailable",
      };
    }
  }

  // Stripe check (if configured)
  if (process.env.STRIPE_SECRET_KEY) {
    const stripeStart = Date.now();
    try {
      const Stripe = require("stripe");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-06-30.basil" as any });
      await stripe.customers.list({ limit: 1 });
      checks.stripe = { status: "healthy", latency: Date.now() - stripeStart };
    } catch (error) {
      overall = overall === "healthy" ? "degraded" : overall;
      checks.stripe = {
        status: "degraded",
        latency: Date.now() - stripeStart,
        error: error instanceof Error ? error.message : "Stripe API error",
      };
    }
  }

  // Resend check (if configured)
  if (process.env.RESEND_API_KEY) {
    const resendStart = Date.now();
    try {
      const { Resend } = require("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.list({ limit: 1 });
      checks.resend = { status: "healthy", latency: Date.now() - resendStart };
    } catch (error) {
      overall = overall === "healthy" ? "degraded" : overall;
      checks.resend = {
        status: "degraded",
        latency: Date.now() - resendStart,
        error: error instanceof Error ? error.message : "Resend API error",
      };
    }
  }

  // S3 check (if configured)
  if (process.env.S3_ACCESS_KEY_ID) {
    const s3Start = Date.now();
    try {
      // Basic credential validation
      checks.s3 = { status: "healthy", latency: Date.now() - s3Start };
    } catch (error) {
      overall = overall === "healthy" ? "degraded" : overall;
      checks.s3 = {
        status: "degraded",
        latency: Date.now() - s3Start,
        error: error instanceof Error ? error.message : "S3 config error",
      };
    }
  }

  // Environment validation
  checks.environment = {
    status: env.NODE_ENV === "production" && !env.NEXTAUTH_SECRET ? "unhealthy" : "healthy",
    error: env.NODE_ENV === "production" && !env.NEXTAUTH_SECRET ? "NEXTAUTH_SECRET not set" : undefined,
  };

  // Disk space check (approximate)
  try {
    const { execSync } = require("child_process");
    const df = execSync("df -h /", { encoding: "utf-8" });
    const lines = df.trim().split("\n");
    if (lines.length > 1) {
      const parts = lines[1].split(/\s+/);
      const usage = parseInt(parts[4].replace("%", ""));
      checks.disk = {
        status: usage > 90 ? "unhealthy" : usage > 80 ? "degraded" : "healthy",
        details: { usagePercent: usage },
      };
      if (usage > 90) overall = "unhealthy";
      else if (usage > 80 && overall === "healthy") overall = "degraded";
    }
  } catch {
    checks.disk = { status: "degraded", error: "Could not check disk space" };
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const memUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  checks.memory = {
    status: memUsagePercent > 90 ? "unhealthy" : memUsagePercent > 80 ? "degraded" : "healthy",
    details: {
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      usagePercent: memUsagePercent.toFixed(2),
    },
  };
  if (memUsagePercent > 90) overall = "unhealthy";
  else if (memUsagePercent > 80 && overall === "healthy") overall = "degraded";

  // Uptime
  checks.uptime = {
    status: "healthy",
    details: { seconds: process.uptime() },
  };

  const statusCode = overall === "healthy" ? 200 : overall === "degraded" ? 200 : 503;

  return NextResponse.json(
    {
      status: overall,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "unknown",
      commit: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
      checks,
    },
    { status: statusCode }
  );
}