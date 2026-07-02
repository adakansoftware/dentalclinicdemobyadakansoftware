import { z } from "zod";

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().optional());

const optionalUrlString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().url().optional());

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  GOOGLE_PLACES_API_KEY: optionalTrimmedString,
  GOOGLE_PLACE_ID: optionalTrimmedString,
  TURNSTILE_SECRET_KEY: optionalTrimmedString,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalTrimmedString,
  SMS_ENABLED: z.enum(["true", "false"]).optional(),
  NETGSM_USERNAME: optionalTrimmedString,
  NETGSM_PASSWORD: optionalTrimmedString,
  NETGSM_HEADER: optionalTrimmedString,
  CRON_SECRET: optionalTrimmedString,
  HEALTHCHECK_SECRET: optionalTrimmedString,
  ADMIN_IP_ALLOWLIST: optionalTrimmedString,
  INTERNAL_API_IP_ALLOWLIST: optionalTrimmedString,
  NEXT_PUBLIC_APP_URL: optionalUrlString,
  NEXT_PUBLIC_SITE_URL: optionalUrlString,
  NEXTAUTH_URL: optionalUrlString,
  VERCEL_URL: optionalTrimmedString,
  VERCEL_BRANCH_URL: optionalTrimmedString,
  VERCEL_PROJECT_PRODUCTION_URL: optionalTrimmedString,
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

function collectEnvIssues(env: AppEnv) {
  const issues: string[] = [];

  if (env.SMS_ENABLED === "true" && (!env.NETGSM_USERNAME || !env.NETGSM_PASSWORD || !env.NETGSM_HEADER)) {
    issues.push("NETGSM_USERNAME, NETGSM_PASSWORD, and NETGSM_HEADER are required when SMS_ENABLED=true");
  }

  const hasTurnstileSecret = Boolean(env.TURNSTILE_SECRET_KEY);
  const hasTurnstileSiteKey = Boolean(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  if (hasTurnstileSecret !== hasTurnstileSiteKey) {
    issues.push("TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY must either both be set or both be empty");
  }

  if (env.CRON_SECRET && env.CRON_SECRET.length < 16) {
    issues.push("CRON_SECRET must be at least 16 characters");
  }

  if (env.HEALTHCHECK_SECRET && env.HEALTHCHECK_SECRET.length < 16) {
    issues.push("HEALTHCHECK_SECRET must be at least 16 characters");
  }

  const allowlistFields = [
    ["ADMIN_IP_ALLOWLIST", env.ADMIN_IP_ALLOWLIST],
    ["INTERNAL_API_IP_ALLOWLIST", env.INTERNAL_API_IP_ALLOWLIST],
  ] as const;

  for (const [label, value] of allowlistFields) {
    if (value && value.length < 3) {
      issues.push(`${label} must contain at least one IP or CIDR entry`);
    }
  }

  if (env.NODE_ENV === "production") {
    const hasCanonicalUrl = Boolean(
      env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_SITE_URL || env.NEXTAUTH_URL || env.VERCEL_PROJECT_PRODUCTION_URL
    );

    if (!hasCanonicalUrl) {
      issues.push(
        "Production requires NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SITE_URL, NEXTAUTH_URL, or VERCEL_PROJECT_PRODUCTION_URL"
      );
    }
  }

  return issues;
}

export function resetEnvCacheForTests() {
  cachedEnv = null;
}

export function getEnvIssues() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return [issue?.message ?? "Invalid environment configuration"];
  }

  return collectEnvIssues(parsed.data);
}

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue?.message ?? "Invalid environment configuration");
  }

  const issues = collectEnvIssues(parsed.data);
  if (issues.length > 0) {
    throw new Error(issues[0]);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getOptionalEnv() {
  return envSchema.partial().parse(process.env);
}
