import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { RateLimitError } from "@/lib/errors";

// Redis-based rate limiter (fallback to in-memory for dev)
let rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
let redis: any = null;

try {
  const { Redis } = require("@upstash/redis");
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch {
  // Redis not available, use in-memory
}

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 100;
const AUTH_RATE_LIMIT_MAX = 5;
const AUTH_RATE_LIMIT_WINDOW = 15 * 60 * 1000;

async function rateLimit(identifier: string, max = RATE_LIMIT_MAX, window = RATE_LIMIT_WINDOW): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const key = `rl:${identifier}`;

  if (redis) {
    try {
      const current = await redis.get(key);
      if (!current || now > (current as any).resetTime) {
        await redis.set(key, { count: 1, resetTime: now + window }, { ex: Math.ceil(window / 1000) });
        return { allowed: true, remaining: max - 1 };
      }
      if ((current as any).count >= max) {
        return { allowed: false, remaining: 0 };
      }
      (current as any).count++;
      await redis.set(key, current, { ex: Math.ceil(window / 1000) });
      return { allowed: true, remaining: max - (current as any).count };
    } catch {
      // Fall through to in-memory
    }
  }

  const record = rateLimitMap.get(identifier);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + window });
    return { allowed: true, remaining: max - 1 };
  }
  if (record.count >= max) {
    return { allowed: false, remaining: 0 };
  }
  record.count++;
  return { allowed: true, remaining: max - record.count };
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "1; mode=block",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

function getCSP(nonce: string): string {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://www.googletagmanager.com`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: https:`,
    `connect-src 'self' https://api.stripe.com https://api.resend.com`,
    `frame-src https://js.stripe.com https://hooks.stripe.com`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");
}

export const middleware = auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const nonce = crypto.randomUUID();
  const ip = (req as any).ip ?? req.headers.get("x-forwarded-for") ?? "unknown";

  // Allow auth pages and API auth routes
  if (pathname.startsWith("/auth") || pathname.startsWith("/api/auth")) {
    const response = NextResponse.next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    return response;
  }

  // Require authentication for everything else
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const response = NextResponse.next();

  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add CSP
  response.headers.set("Content-Security-Policy", getCSP(nonce));

  return response;
});

export const config = {
  matcher: ["/((?!api/webhooks|_next/static|_next/image|favicon.ico|public).*)"],
};
