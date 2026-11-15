import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { validateCsrfRequest } from "@/lib/csrf";
import { auth } from "@/lib/auth";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function withErrorHandler(
  handler: (req: NextRequest, context: { userId?: string; organizationId?: string }) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
    logger.setContext({ requestId });

    try {
      // CSRF validation for mutation methods
      if (MUTATION_METHODS.has(req.method)) {
        const session = await auth();
        const sessionId = session?.user?.id;
        const csrfResult = validateCsrfRequest(req.headers, sessionId);

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

      const session = await auth();
      const context = {
        userId: session?.user?.id,
        organizationId: (session?.user as any)?.organizationId,
      };

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
