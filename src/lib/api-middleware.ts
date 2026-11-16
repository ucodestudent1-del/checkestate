import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { validateCsrfRequest } from "@/lib/csrf";
import { auth } from "@/lib/auth";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function withErrorHandler(
  handler: (req: NextRequest, context: { userId?: string; organizationId?: string; resourceId?: string }) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
    logger.setContext({ requestId });

    try {
      // Get session once for both CSRF and context
      const session = await auth();
      const userId = session?.user?.id;
      const organizationId = (session?.user as any)?.organizationId;

      // Extract resource ID from URL path (e.g., /api/properties/[id])
      const resourceId = req.nextUrl.pathname.split("/").pop()?.replace(/^\[.*\]$/, "") || undefined;

      // CSRF validation for mutation methods
      if (MUTATION_METHODS.has(req.method)) {
        const csrfResult = validateCsrfRequest(req.headers, userId);

        if (!csrfResult.valid) {
          logger.warn("CSRF validation failed", {
            method: req.method,
            path: req.nextUrl.pathname,
            reason: csrfResult.reason,
          });
          return NextResponse.json(
            { error: "CSRF validation failed", reason: csrfResult.reason },
            { status: 403 }
          );
        }
      }

      const context = { userId, organizationId, resourceId };

      const response = await handler(req, context);
      const duration = Date.now() - startTime;

      logger.info("API request completed", {
        method: req.method,
        path: req.nextUrl.pathname,
        status: response.status,
        durationMs: duration,
        userId: context.userId,
        organizationId: context.organizationId,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const { error: errorMessage, statusCode, issues } = handleApiError(error);

      logger.error("API request failed", {
        method: req.method,
        path: req.nextUrl.pathname,
        error: errorMessage,
        statusCode,
        durationMs: duration,
      });

      return NextResponse.json(
        { error: errorMessage, ...(issues ? { issues } : {}) },
        { status: statusCode }
      );
    }
  };
}
