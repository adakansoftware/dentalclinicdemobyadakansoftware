import assert from "node:assert/strict";
import {
  compareDateStrings,
  dateOnlyToDbDate,
  dateToIsoDate,
  getCurrentMinutesInTurkey,
  getDayOfWeekFromDate,
  getTodayDateInTurkey,
  getTomorrowDateInTurkey,
  getUtcRangeForTurkeyDate,
} from "../src/lib/date.ts";
import { buildHealthSummary } from "../src/lib/health.ts";
import { canTransitionAppointmentStatus, getAllowedAppointmentTransitions } from "../src/lib/appointment-state.ts";
import { isStatusBlockingSlot, timesOverlap } from "../src/lib/appointment-conflicts.ts";
import { getEnv, resetEnvCacheForTests } from "../src/lib/env.ts";
import {
  buildRequestFingerprintFromHeaders,
  enforceRateLimitByKey,
  getClientIpFromHeadersSync,
  validateFormAge,
  validateHoneypot,
} from "../src/lib/security-core.ts";
import { getDurationMs } from "../src/lib/observability.ts";
import { SOCIAL_IMAGE_HEIGHT, SOCIAL_IMAGE_PATH, SOCIAL_IMAGE_WIDTH, TWITTER_IMAGE_PATH } from "../src/lib/social-preview.ts";
import { sanitizeAssetReference } from "../src/lib/upload-assets.ts";

const results: string[] = [];

function run(name: string, fn: () => void) {
  fn();
  results.push(name);
}

function withEnv(patch: Record<string, string | undefined>, fn: () => void) {
  const previous = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(patch)) {
    previous.set(key, process.env[key]);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  resetEnvCacheForTests();

  try {
    fn();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    resetEnvCacheForTests();
  }
}

run("getTodayDateInTurkey returns Turkey-local date", () => {
  const now = new Date("2026-04-05T00:30:00.000Z");
  assert.equal(getTodayDateInTurkey(now), "2026-04-05");
});

run("getTomorrowDateInTurkey rolls over correctly", () => {
  const now = new Date("2026-12-31T20:30:00.000Z");
  assert.equal(getTomorrowDateInTurkey(now), "2027-01-01");
});

run("getCurrentMinutesInTurkey returns local time in minutes", () => {
  const now = new Date("2026-04-05T06:15:00.000Z");
  assert.equal(getCurrentMinutesInTurkey(now), 555);
});

run("compareDateStrings sorts ISO dates", () => {
  assert.equal(compareDateStrings("2026-04-05", "2026-04-05"), 0);
  assert.equal(compareDateStrings("2026-04-04", "2026-04-05"), -1);
  assert.equal(compareDateStrings("2026-04-06", "2026-04-05"), 1);
});

run("getDayOfWeekFromDate returns UTC-safe weekday", () => {
  assert.equal(getDayOfWeekFromDate("2026-04-05"), 0);
  assert.equal(getDayOfWeekFromDate("2026-04-06"), 1);
});

run("dateOnlyToDbDate and dateToIsoDate preserve date-only values", () => {
  const dbDate = dateOnlyToDbDate("2026-04-05");
  assert.equal(dateToIsoDate(dbDate), "2026-04-05");
});

run("getUtcRangeForTurkeyDate returns expected UTC range", () => {
  const { startUtc, endUtc } = getUtcRangeForTurkeyDate("2026-04-05");
  assert.ok(startUtc < endUtc);
  assert.equal(startUtc.toISOString(), "2026-04-04T21:00:00.000Z");
  assert.equal(endUtc.toISOString(), "2026-04-05T20:59:59.999Z");
});

run("getClientIpFromHeadersSync prefers forwarded headers", () => {
  const headerStore = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.2",
  });

  assert.equal(getClientIpFromHeadersSync(headerStore), "203.0.113.10");
});

run("getClientIpFromHeadersSync prefers provider headers and strips ports", () => {
  const headerStore = new Headers({
    "cf-connecting-ip": "198.51.100.9",
    "x-forwarded-for": "203.0.113.10:443, 10.0.0.2",
    "x-real-ip": "198.51.100.1",
  });

  assert.equal(getClientIpFromHeadersSync(headerStore), "198.51.100.9");
});

run("getClientIpFromHeadersSync falls back to RFC forwarded header syntax", () => {
  const headerStore = new Headers({
    forwarded: 'for="[2001:db8::1]:1234";proto=https',
  });

  assert.equal(getClientIpFromHeadersSync(headerStore), "2001:db8::1");
});

run("buildRequestFingerprintFromHeaders includes IP and user agent", () => {
  const headerStore = new Headers({
    "x-real-ip": "198.51.100.1",
    "user-agent": "SmokeTestAgent/1.0",
  });

  assert.equal(buildRequestFingerprintFromHeaders(headerStore), "198.51.100.1:SmokeTestAgent/1.0");
});

run("getDurationMs never returns negative values", () => {
  assert.equal(getDurationMs(Date.now() + 1000), 0);
});

run("timesOverlap detects overlapping slots but allows edge-aligned slots", () => {
  assert.equal(timesOverlap("09:00", "09:30", "09:15", "09:45"), true);
  assert.equal(timesOverlap("09:00", "09:30", "09:30", "10:00"), false);
  assert.equal(timesOverlap("10:00", "10:30", "09:30", "10:00"), false);
});

run("isStatusBlockingSlot only blocks active booking states", () => {
  assert.equal(isStatusBlockingSlot("PENDING"), true);
  assert.equal(isStatusBlockingSlot("CONFIRMED"), true);
  assert.equal(isStatusBlockingSlot("CANCELLED"), false);
  assert.equal(isStatusBlockingSlot("COMPLETED"), false);
});

run("appointment transition rules allow only supported status changes", () => {
  assert.deepEqual(getAllowedAppointmentTransitions("PENDING"), ["CONFIRMED", "CANCELLED"]);
  assert.equal(canTransitionAppointmentStatus("PENDING", "COMPLETED"), false);
  assert.equal(canTransitionAppointmentStatus("CANCELLED", "CONFIRMED"), true);
  assert.equal(canTransitionAppointmentStatus("COMPLETED", "PENDING"), false);
});

run("buildHealthSummary returns warn when configuration is incomplete", () => {
  const summary = buildHealthSummary({
    databaseOk: true,
    envIssues: ["Canonical URL missing"],
    smsEnabled: false,
    hasCanonicalUrl: false,
    turnstileConfigured: false,
    cronConfigured: true,
    dbHardeningConfigured: false,
  });

  assert.equal(summary.status, "warn");
  assert.equal(summary.checks.some((check) => check.key === "database" && check.ok), true);
  assert.equal(summary.checks.some((check) => check.key === "canonical_url" && check.ok === false), true);
  assert.equal(summary.checks.some((check) => check.key === "db_hardening" && check.ok === false), true);
});

run("buildHealthSummary returns error when database is down", () => {
  const summary = buildHealthSummary({
    databaseOk: false,
    envIssues: [],
    smsEnabled: true,
    hasCanonicalUrl: true,
    turnstileConfigured: true,
    cronConfigured: true,
    dbHardeningConfigured: true,
  });

  assert.equal(summary.status, "error");
});


run("validateHoneypot rejects filled bot field", () => {
  const formData = new FormData();
  formData.set("website", "spam");
  assert.equal(validateHoneypot(formData), false);
});

run("validateFormAge accepts sufficiently old forms", () => {
  const formData = new FormData();
  formData.set("formStartedAt", String(Date.now() - 2000));
  assert.equal(validateFormAge(formData), true);
});

run("enforceRateLimitByKey blocks after limit", () => {
  const scope = `unit-test-${Date.now()}`;
  const options = { scope, limit: 2, windowMs: 60_000 };

  assert.equal(enforceRateLimitByKey(options, "same-user"), true);
  assert.equal(enforceRateLimitByKey(options, "same-user"), true);
  assert.equal(enforceRateLimitByKey(options, "same-user"), false);
});

run("getEnv rejects SMS_ENABLED without provider credentials", () => {
  withEnv(
    {
      DATABASE_URL: "postgresql://example",
      SESSION_SECRET: "12345678901234567890123456789012",
      SMS_ENABLED: "true",
      NETGSM_USERNAME: undefined,
      NETGSM_PASSWORD: undefined,
      NETGSM_HEADER: undefined,
      NODE_ENV: "development",
    },
    () => {
      assert.throws(
        () => getEnv(),
        /NETGSM_USERNAME, NETGSM_PASSWORD, and NETGSM_HEADER are required when SMS_ENABLED=true/
      );
    }
  );
});

run("getEnv rejects partial Turnstile configuration", () => {
  withEnv(
    {
      DATABASE_URL: "postgresql://example",
      SESSION_SECRET: "12345678901234567890123456789012",
      TURNSTILE_SECRET_KEY: "turnstile-secret",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: undefined,
      NODE_ENV: "development",
    },
    () => {
      assert.throws(
        () => getEnv(),
        /TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY must either both be set or both be empty/
      );
    }
  );
});

run("getEnv requires a canonical URL in production", () => {
  withEnv(
    {
      DATABASE_URL: "postgresql://example",
      SESSION_SECRET: "12345678901234567890123456789012",
      SMS_ENABLED: "false",
      NEXT_PUBLIC_APP_URL: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
      NEXTAUTH_URL: undefined,
      VERCEL_PROJECT_PRODUCTION_URL: undefined,
      NODE_ENV: "production",
    },
    () => {
      assert.throws(
        () => getEnv(),
        /Production requires NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SITE_URL, NEXTAUTH_URL, or VERCEL_PROJECT_PRODUCTION_URL/
      );
    }
  );
});

run("getEnv accepts valid minimal configuration", () => {
  withEnv(
    {
      DATABASE_URL: "postgresql://example",
      SESSION_SECRET: "12345678901234567890123456789012",
      SMS_ENABLED: "false",
      NEXT_PUBLIC_APP_URL: "https://adakan.example",
      NETGSM_USERNAME: undefined,
      NETGSM_PASSWORD: undefined,
      NETGSM_HEADER: undefined,
      NODE_ENV: "development",
    },
    () => {
      const env = getEnv();
      assert.equal(env.DATABASE_URL, "postgresql://example");
      assert.equal(env.SMS_ENABLED, "false");
      assert.equal(env.NEXT_PUBLIC_APP_URL, "https://adakan.example");
    }
  );
});

run("social preview metadata constants stay aligned", () => {
  assert.equal(SOCIAL_IMAGE_PATH, "/opengraph-image.png");
  assert.equal(TWITTER_IMAGE_PATH, "/twitter-image.png");
  assert.equal(SOCIAL_IMAGE_WIDTH, 2400);
  assert.equal(SOCIAL_IMAGE_HEIGHT, 1260);
});

run("sanitizeAssetReference rejects off-origin asset urls", () => {
  withEnv(
    {
      DATABASE_URL: "postgresql://example",
      SESSION_SECRET: "12345678901234567890123456789012",
      NEXT_PUBLIC_APP_URL: "https://clinic.example",
      SMS_ENABLED: "false",
      NODE_ENV: "development",
    },
    () => {
      assert.equal(sanitizeAssetReference("/opengraph-image.png"), "/opengraph-image.png");
      assert.equal(
        sanitizeAssetReference("https://clinic.example/twitter-image.png"),
        "https://clinic.example/twitter-image.png"
      );
      assert.equal(sanitizeAssetReference("https://evil.example/og.png"), "");
    }
  );
});

console.log(`Unit tests passed: ${results.length}`);
for (const result of results) {
  console.log(`- ${result}`);
}
