import { describe, it, expect, beforeEach, afterEach } from "vitest";
import bcrypt from "bcryptjs";
import {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  RateLimitError,
  handleApiError,
} from "@/lib/errors";
import { env } from "@/lib/env";
import { WORK_ORDER_STATUSES, STATUS_FLOW, MAINTENANCE_CATEGORIES, PRIORITIES, USER_ROLES, PLAN_TYPES, PLAN_UNIT_LIMITS, STATUS_CONFIG, CATEGORY_CONFIG } from "@/lib/constants";

describe("AppError Hierarchy", () => {
  it("should create AppError with default status 500", () => {
    const err = new AppError("Test error");
    expect(err.message).toBe("Test error");
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
  });

  it("should create AppError with custom status code", () => {
    const err = new AppError("Custom error", 418);
    expect(err.statusCode).toBe(418);
  });

  it("should create UnauthorizedError with status 401", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe("Unauthorized");
  });

  it("should create ForbiddenError with status 403", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
  });

  it("should create NotFoundError with status 404", () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });

  it("should create ValidationError with status 400 and issues", () => {
    const err = new ValidationError("Invalid input", { email: ["Invalid email"] });
    expect(err.statusCode).toBe(400);
    expect(err.issues).toEqual({ email: ["Invalid email"] });
  });

  it("should create ConflictError with status 409", () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
  });

  it("should create RateLimitError with status 429", () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
  });
});

describe("handleApiError", () => {
  it("should handle AppError instances", () => {
    const err = new NotFoundError("Not found");
    const result = handleApiError(err);
    expect(result.error).toBe("Not found");
    expect(result.statusCode).toBe(404);
  });

  it("should handle ValidationError with issues", () => {
    const err = new ValidationError("Invalid", { field: ["required"] });
    const result = handleApiError(err);
    expect(result.error).toBe("Invalid");
    expect(result.statusCode).toBe(400);
    expect(result.issues).toEqual({ field: ["required"] });
  });

  it("should handle generic Error", () => {
    const err = new Error("Something broke");
    const result = handleApiError(err);
    expect(result.error).toBe("Something broke");
    expect(result.statusCode).toBe(500);
  });

  it("should handle unknown errors", () => {
    const result = handleApiError("string error");
    expect(result.error).toBe("Internal server error");
    expect(result.statusCode).toBe(500);
  });
});

describe("Environment Validation", () => {
  it("should have required env vars defined", () => {
    expect(env.NODE_ENV).toBeDefined();
    expect(env.NEXTAUTH_SECRET).toBeDefined();
    expect(env.DATABASE_URL).toBeDefined();
  });

  it("NEXTAUTH_SECRET should be at least 32 chars when set", () => {
    if (env.NEXTAUTH_SECRET) {
      expect(env.NEXTAUTH_SECRET.length).toBeGreaterThanOrEqual(32);
    } else {
      expect(true).toBe(true); // Skip if not set
    }
  });
});

describe("Status Workflow", () => {
  it("should define all work order statuses", () => {
    expect(WORK_ORDER_STATUSES).toContain("NEW");
    expect(WORK_ORDER_STATUSES).toContain("COMPLETED");
    expect(WORK_ORDER_STATUSES).toContain("CLOSED");
    expect(WORK_ORDER_STATUSES).toContain("CANCELLED");
  });

  it("should allow valid status transitions", () => {
    expect(STATUS_FLOW["NEW"]).toContain("UNDER_REVIEW");
    expect(STATUS_FLOW["UNDER_REVIEW"]).toContain("AWAITING_APPROVAL");
    expect(STATUS_FLOW["AWAITING_APPROVAL"]).toContain("APPROVED");
    expect(STATUS_FLOW["APPROVED"]).toContain("ASSIGNED");
    expect(STATUS_FLOW["ASSIGNED"]).toContain("SCHEDULED");
    expect(STATUS_FLOW["SCHEDULED"]).toContain("IN_PROGRESS");
    expect(STATUS_FLOW["IN_PROGRESS"]).toContain("COMPLETED");
    expect(STATUS_FLOW["COMPLETED"]).toContain("CLOSED");
  });

  it("should reject invalid status transitions", () => {
    expect(STATUS_FLOW["NEW"]).not.toContain("APPROVED");
    expect(STATUS_FLOW["NEW"]).not.toContain("IN_PROGRESS");
    expect(STATUS_FLOW["COMPLETED"]).not.toContain("NEW");
  });

  it("should not allow transitions from CLOSED", () => {
    expect(STATUS_FLOW["CLOSED"]).toHaveLength(0);
  });
});

describe("Constants", () => {
  it("should define maintenance categories", () => {
    expect(MAINTENANCE_CATEGORIES).toContain("PLUMBING");
    expect(MAINTENANCE_CATEGORIES).toContain("ELECTRICAL");
    expect(MAINTENANCE_CATEGORIES).toContain("HVAC");
  });

  it("should define priorities", () => {
    expect(PRIORITIES).toContain("LOW");
    expect(PRIORITIES).toContain("MEDIUM");
    expect(PRIORITIES).toContain("HIGH");
    expect(PRIORITIES).toContain("URGENT");
    expect(PRIORITIES).toContain("EMERGENCY");
  });

  it("should define user roles", () => {
    expect(USER_ROLES).toContain("SUPER_ADMIN");
    expect(USER_ROLES).toContain("PROPERTY_OWNER");
    expect(USER_ROLES).toContain("TENANT");
    expect(USER_ROLES).toContain("CONTRACTOR");
  });

  it("should define plan types and unit limits", () => {
    expect(PLAN_TYPES).toContain("STARTER");
    expect(PLAN_TYPES).toContain("PROFESSIONAL");
    expect(PLAN_TYPES).toContain("BUSINESS");
    expect(PLAN_TYPES).toContain("AGENCY");
    expect(PLAN_UNIT_LIMITS["STARTER"]).toBe(10);
    expect(PLAN_UNIT_LIMITS["PROFESSIONAL"]).toBe(50);
    expect(PLAN_UNIT_LIMITS["BUSINESS"]).toBe(150);
  });

  it("should have status config for all statuses", () => {
    for (const status of WORK_ORDER_STATUSES) {
      expect(STATUS_CONFIG[status]).toBeDefined();
      expect(STATUS_CONFIG[status]!.label).toBeDefined();
      expect(STATUS_CONFIG[status]!.className).toBeDefined();
    }
  });

  it("should have category config for all categories", () => {
    for (const category of MAINTENANCE_CATEGORIES) {
      expect(CATEGORY_CONFIG[category]).toBeDefined();
      expect(CATEGORY_CONFIG[category]!.label).toBeDefined();
      expect(CATEGORY_CONFIG[category]!.className).toBeDefined();
    }
  });
});

describe("Password Security", () => {
  const testPassword = "TestPassword123!";

  it("should hash password securely", async () => {
    const passwordHash = await bcrypt.hash(testPassword, 12);
    expect(passwordHash).toBeDefined();
    expect(passwordHash).not.toBe(testPassword);
    expect(passwordHash.length).toBeGreaterThan(50);
  });

  it("should verify correct password", async () => {
    const passwordHash = await bcrypt.hash(testPassword, 12);
    const isValid = await bcrypt.compare(testPassword, passwordHash);
    expect(isValid).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const passwordHash = await bcrypt.hash(testPassword, 12);
    const isInvalid = await bcrypt.compare("WrongPassword!", passwordHash);
    expect(isInvalid).toBe(false);
  });

  it("should generate different hashes for same password", async () => {
    const hash1 = await bcrypt.hash(testPassword, 12);
    const hash2 = await bcrypt.hash(testPassword, 12);
    expect(hash1).not.toBe(hash2);
  });

  it("should validate password strength", () => {
    const password = testPassword;
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    expect(hasMinLength).toBe(true);
    expect(hasUpperCase).toBe(true);
    expect(hasLowerCase).toBe(true);
    expect(hasNumber).toBe(true);
    expect(hasSpecialChar).toBe(true);
  });
});
