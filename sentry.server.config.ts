import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;
const environment = process.env.NODE_ENV || "development";

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
    profilesSampleRate: environment === "production" ? 0.1 : 1.0,
    debug: environment === "development",
    
    // Performance monitoring
    enableTracing: true,
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore NextAuth errors in development
        if (environment === "development" && error.message.includes("NEXT_AUTH")) {
          return null;
        }
        // Ignore network errors
        if (error.message.includes("ECONNREFUSED") || error.message.includes("network")) {
          return null;
        }
      }
      return event;
    },
    
    // Release tracking
    release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,
    
    // Custom tags
    initialScope: {
      tags: {
        service: "checkestate-api",
        team: "engineering",
      },
    },
  });
}

export const onRequestError = Sentry.captureRequestError;
export const middleware = Sentry.withSentryMiddleware;

// Custom error capture with context
export function captureError(error: Error, context?: Record<string, any>) {
  if (!dsn) {
    console.error("Error (Sentry not configured):", error, context);
    return;
  }
  
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

// Capture message with level
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: Record<string, any>) {
  if (!dsn) {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
    return;
  }
  
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureMessage(message);
  });
}

// Add breadcrumb for debugging
export function addBreadcrumb(category: string, message: string, data?: Record<string, any>) {
  if (!dsn) return;
  
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level: "info",
  });
}