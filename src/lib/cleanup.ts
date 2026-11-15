import { db } from "@/lib/db";

export async function cleanupExpiredPasswordResetTokens(): Promise<number> {
  const result = await db.passwordResetToken.deleteMany({
    where: {
      expires: { lt: new Date() },
    },
  });
  return result.count;
}

export async function cleanupExpiredVerificationTokens(): Promise<number> {
  const result = await db.verificationToken.deleteMany({
    where: {
      expires: { lt: new Date() },
    },
  });
  return result.count;
}

export async function cleanupExpiredTenantInvitations(): Promise<number> {
  const result = await db.tenantInvitation.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
      isActive: true,
      acceptedAt: null,
    },
  });
  return result.count;
}

export async function runAllCleanups(): Promise<{
  passwordResetTokens: number;
  verificationTokens: number;
  tenantInvitations: number;
}> {
  const [passwordResetTokens, verificationTokens, tenantInvitations] = await Promise.all([
    cleanupExpiredPasswordResetTokens(),
    cleanupExpiredVerificationTokens(),
    cleanupExpiredTenantInvitations(),
  ]);

  return { passwordResetTokens, verificationTokens, tenantInvitations };
}