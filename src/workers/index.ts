import { runNotificationWorkers } from "@/lib/notifications";
import { cleanupExpiredPasswordResetTokens, cleanupExpiredVerificationTokens, cleanupExpiredTenantInvitations } from "@/lib/cleanup";
import { logger } from "@/lib/logger";

async function runWorkers() {
  logger.info("Starting background workers");

  try {
    await runNotificationWorkers();
  } catch (error) {
    logger.error("Notification worker failed", { error });
  }

  try {
    const cleanupResults = await Promise.all([
      cleanupExpiredPasswordResetTokens(),
      cleanupExpiredVerificationTokens(),
      cleanupExpiredTenantInvitations(),
    ]);
    logger.info("Cleanup completed", { cleanupResults });
  } catch (error) {
    logger.error("Cleanup worker failed", { error });
  }

  logger.info("Background workers completed");
}

runWorkers()
  .then(() => {
    logger.info("Worker process exiting");
    process.exit(0);
  })
  .catch((error) => {
    logger.error("Worker process failed", { error });
    process.exit(1);
  });