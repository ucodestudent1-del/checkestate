import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters").optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  DATABASE_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_ENABLED: z.string().default("false"),
  FREE_TRIAL_ENABLED: z.string().default("true"),
  FREE_TRIAL_DAYS: z.string().default("14"),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const missing = Object.keys(parsed.error.flatten().fieldErrors);
    // Only throw in production for missing critical vars
    if (process.env.NODE_ENV === "production" && missing.length > 0) {
      throw new Error(
        `Missing or invalid environment variables: ${missing.join(", ")}. ` +
          "Check .env.example for required variables."
      );
    }
    // Return defaults for missing optional vars in non-production
    return {
      NODE_ENV: process.env.NODE_ENV || "development",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      DATABASE_URL: process.env.DATABASE_URL,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
      S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
      S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
      S3_BUCKET: process.env.S3_BUCKET,
      S3_REGION: process.env.S3_REGION,
      S3_ENDPOINT: process.env.S3_ENDPOINT,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      AI_ENABLED: process.env.AI_ENABLED || "false",
      FREE_TRIAL_ENABLED: process.env.FREE_TRIAL_ENABLED || "true",
      FREE_TRIAL_DAYS: process.env.FREE_TRIAL_DAYS || "14",
      SENTRY_DSN: process.env.SENTRY_DSN,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    } as Env;
  }

  return parsed.data;
}

export const env = validateEnv();
