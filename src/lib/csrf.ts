import crypto from "crypto";

const CSRF_TOKEN_SECRET = process.env.CSRF_SECRET_KEY || process.env.NEXTAUTH_SECRET || "default-csrf-secret-change-in-production";

export function generateCsrfToken(sessionId: string): string {
  return crypto.createHmac("sha256", CSRF_TOKEN_SECRET).update(sessionId).digest("hex");
}

export function validateCsrfToken(token: string, sessionId: string): boolean {
  const expected = generateCsrfToken(sessionId);
  return crypto.timingSafeEqual(
    Buffer.from(token, "hex"),
    Buffer.from(expected, "hex")
  );
}

export interface CsrfValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateCsrfRequest(
  headers: Headers,
  sessionId: string | null
): CsrfValidationResult {
  // Allow GET, HEAD, OPTIONS (safe methods)
  // CSRF only applies to state-changing methods

  if (!sessionId) {
    return { valid: false, reason: "No session" };
  }

  const token = headers.get("x-csrf-token");
  if (!token) {
    return { valid: false, reason: "Missing CSRF token" };
  }

  if (!validateCsrfToken(token, sessionId)) {
    return { valid: false, reason: "Invalid CSRF token" };
  }

  return { valid: true };
}
