import { z } from "zod";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  issues?: Record<string, string[]>;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation error", issues?: Record<string, string[]>) {
    super(message, 400);
    this.issues = issues;
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429);
  }
}

export function handleApiError(error: unknown): { error: string; statusCode: number; issues?: Record<string, string[]> } {
  if (error instanceof AppError) {
    return {
      error: error.message,
      statusCode: error.statusCode,
      ...(error.issues && { issues: error.issues }),
    };
  }

  if (error instanceof z.ZodError) {
    const issues: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join(".");
      if (!issues[path]) issues[path] = [];
      issues[path].push(issue.message);
    }
    return { error: "Validation error", statusCode: 400, issues };
  }

  if (error instanceof Error) {
    return { error: error.message, statusCode: 500 };
  }

  return { error: "Internal server error", statusCode: 500 };
}
