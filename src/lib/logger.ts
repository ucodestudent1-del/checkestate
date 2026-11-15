import { env } from "@/lib/env";

export interface LogContext {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  action?: string;
  [key: string]: unknown;
}

export class Logger {
  private context: LogContext = {};

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  private format(level: string, message: string, meta?: Record<string, unknown>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...meta,
    };

    if (env.NODE_ENV === "development") {
      (console as any)[level]?.(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.format("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.format("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.format("error", message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (env.NODE_ENV === "development") {
      this.format("debug", message, meta);
    }
  }
}

export const logger = new Logger();

export function withRequestId(req: Request): string {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  logger.setContext({ requestId });
  return requestId;
}
