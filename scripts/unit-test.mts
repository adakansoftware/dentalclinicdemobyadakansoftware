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
import { getRequestIdFromHeaders } from "../src/lib/api-security.ts";
import { BackendError, isBackendError } from "../src/lib/backend-errors.ts";
import { clearSuspicion, getSuspicionDecision, recordSuspiciousActivity } from "../src/lib/attack-monitor.ts";
import { authorizeBearerSecret } from "../src/lib/endpoint-guard.ts";
import { getEnv, resetEnvCacheForTests } from "../src/lib/env.ts";
import {
  buildRequestFingerprintFromHeaders,
  enforceRateLimitByKey,
  getRateLimitDecisionByKey,
  getClientIpFromHeadersSync,
  validateFormAge,
  validateHoneypot,
} from "../src/lib/security-core.ts";
import { getDurationMs } from "../src/lib/observability.ts";
import { ResilienceError, getResilienceSnapshot, runWithCircuitBreaker, runWithConcurrencyLimit, runWithTimeout } from "../src/lib/resilience.ts";
import { headersFromNodeRequest } from "../src/lib/request-headers.ts";
import { SOCIAL_IMAGE_HEIGHT, SOCIAL_IMAGE_PATH, SOCIAL_IMAGE_WIDTH, TWITTER_IMAGE_PATH } from "../src/lib/social-preview.ts";
import { sanitizeAssetReference } from "../src/lib/upload-assets.ts";

const results: string[] = [];

async function run(name: string, fn: () => void | Promise<void>) {
  await fn();
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

await run("getTodayDateInTurkey returns Turkey-local date", () => {
  const now = new Date("2026-04-05T00:30:00.000Z");
  assert.equal(getTodayDateInTurkey(now), "2026-04-05");
});

await run("getTomorrowDateInTurkey rolls over correctly", () => {
  const now = new Date("2026-12-31T20:30:00.000Z");
  assert.equal(getTomorrowDateInTurkey(now), "2027-01-01");
});

await run("getCurrentMinutesInTurkey returns local time in minutes", () => {
  const now = new Date("2026-04-05T06:15:00.000Z");
  assert.equal(getCurrentMinutesInTurkey(now), 555);
});

await run("compareDateStrings sorts ISO dates", () => {
  assert.equal(compareDateStrings("2026-04-05", "2026-04-05"), 0);
  assert.equal(compareDateStrings("2026-04-04", "2026-04-05"), -1);
  assert.equal(compareDateStrings("2026-04-06", "2026-04-05"), 1);
});

await run("getDayOfWeekFromDate returns UTC-safe weekday", () => {
  assert.equal(getDayOfWeekFromDate("2026-04-05"), 0);
  assert.equal(getDayOfWeekFromDate("2026-04-06"), 1);
});

await run("dateOnlyToDbDate and dateToIsoDate preserve date-only values", () => {
  const dbDate = dateOnlyToDbDate("2026-04-05");
  assert.equal(dateToIsoDate(dbDate), "2026-04-05");
});

await run("getUtcRangeForTurkeyDate returns expected UTC range", () => {
  const { startUtc, endUtc } = getUtcRangeForTurkeyDate("2026-04-05");
  assert.ok(startUtc < endUtc);
  assert.equal(startUtc.toISOString(), "2026-04-04T21:00:00.000Z");
  assert.equal(endUtc.toISOString(), "2026-04-05T20:59:59.999Z");
});

await run("getClientIpFromHeadersSync prefers forwarded headers", () => {
  const headerStore = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.2",
  });

  assert.equal(getClientIpFromHeadersSync(headerStore), "203.0.113.10");
});

await run("getClientIpFromHeadersSync prefers provider headers and strips ports", () => {
  const headerStore = new Headers({
    "cf-connecting-ip": "198.51.100.9",
    "x-forwarded-for": "203.0.113.10:443, 10.0.0.2",
    "x-real-ip": "198.51.100.1",
  });

  assert.equal(getClientIpFromHeadersSync(headerStore), "198.51.100.9");
});

await run("getClientIpFromHeadersSync falls back to RFC forwarded header syntax", () => {
  const headerStore = new Headers({
    forwarded: 'for="[2001:db8::1]:1234";proto=https',
  });

  assert.equal(getClientIpFromHeadersSync(headerStore), "2001:db8::1");
});

await run("buildRequestFingerprintFromHeaders includes IP and user agent", () => {
  const headerStore = new Headers({
    "x-real-ip": "198.51.100.1",
    "user-agent": "SmokeTestAgent/1.0",
  });

  assert.equal(buildRequestFingerprintFromHeaders(headerStore), "198.51.100.1:SmokeTestAgent/1.0");
});

await run("getRequestIdFromHeaders rejects invalid request ids", () => {
  const invalid = new Headers({
    "x-request-id": "bad value with spaces",
  });
  const valid = new Headers({
    "x-request-id": "req-demo-12345",
  });

  assert.equal(getRequestIdFromHeaders(valid), "req-demo-12345");
  assert.equal(/^[a-zA-Z0-9._:-]{8,120}$/.test(getRequestIdFromHeaders(invalid)), true);
});

await run("headersFromNodeRequest normalizes string arrays", () => {
  const headers = headersFromNodeRequest({
    authorization: ["Bearer one", "Bearer two"],
    "x-test": "value",
  });

  assert.equal(headers.get("authorization"), "Bearer one, Bearer two");
  assert.equal(headers.get("x-test"), "value");
});

await run("authorizeBearerSecret validates bearer tokens safely", () => {
  const authorized = new Headers({
    authorization: "Bearer super-secret",
  });
  const unauthorized = new Headers({
    authorization: "Bearer wrong-secret",
  });

  assert.equal(authorizeBearerSecret(authorized, "super-secret"), true);
  assert.equal(authorizeBearerSecret(unauthorized, "super-secret"), false);
  assert.equal(authorizeBearerSecret(new Headers(), "super-secret"), false);
});

await run("getDurationMs never returns negative values", () => {
  assert.equal(getDurationMs(Date.now() + 1000), 0);
});

await run("timesOverlap detects overlapping slots but allows edge-aligned slots", () => {
  assert.equal(timesOverlap("09:00", "09:30", "09:15", "09:45"), true);
  assert.equal(timesOverlap("09:00", "09:30", "09:30", "10:00"), false);
  assert.equal(timesOverlap("10:00", "10:30", "09:30", "10:00"), false);
});

await run("isStatusBlockingSlot only blocks active booking states", () => {
  assert.equal(isStatusBlockingSlot("PENDING"), true);
  assert.equal(isStatusBlockingSlot("CONFIRMED"), true);
  assert.equal(isStatusBlockingSlot("CANCELLED"), false);
  assert.equal(isStatusBlockingSlot("COMPLETED"), false);
});

await run("appointment transition rules allow only supported status changes", () => {
  assert.deepEqual(getAllowedAppointmentTransitions("PENDING"), ["CONFIRMED", "CANCELLED"]);
  assert.equal(canTransitionAppointmentStatus("PENDING", "COMPLETED"), false);
  assert.equal(canTransitionAppointmentStatus("CANCELLED", "CONFIRMED"), true);
  assert.equal(canTransitionAppointmentStatus("COMPLETED", "PENDING"), false);
});

await run("BackendError helpers preserve typed backend error codes", () => {
  const error = new BackendError("SLOT_UNAVAILABLE", "Slot is already booked", {
    specialistId: "spec-1",
  });

  assert.equal(isBackendError(error), true);
  assert.equal(isBackendError(error, "SLOT_UNAVAILABLE"), true);
  assert.equal(isBackendError(error, "APPOINTMENT_NOT_FOUND"), false);
  assert.equal(isBackendError(new BackendError("CONTACT_REQUEST_NOT_FOUND")), true);
  assert.equal(isBackendError(new Error("plain error")), false);
});

await run("buildHealthSummary returns warn when configuration is incomplete", () => {
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

await run("buildHealthSummary returns error when database is down", () => {
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


await run("validateHoneypot rejects filled bot field", () => {
  const formData = new FormData();
  formData.set("website", "spam");
  assert.equal(validateHoneypot(formData), false);
});

await run("validateFormAge accepts sufficiently old forms", () => {
  const formData = new FormData();
  formData.set("formStartedAt", String(Date.now() - 2000));
  assert.equal(validateFormAge(formData), true);
});

await run("enforceRateLimitByKey blocks after limit", () => {
  const scope = `unit-test-${Date.now()}`;
  const options = { scope, limit: 2, windowMs: 60_000 };

  assert.equal(enforceRateLimitByKey(options, "same-user"), true);
  assert.equal(enforceRateLimitByKey(options, "same-user"), true);
  assert.equal(enforceRateLimitByKey(options, "same-user"), false);
});

await run("getRateLimitDecisionByKey returns retry information after repeated abuse", () => {
  const scope = `unit-test-adaptive-${Date.now()}`;
  const options = { scope, limit: 1, windowMs: 60_000 };

  assert.equal(getRateLimitDecisionByKey(options, "same-user").allowed, true);
  const blocked = getRateLimitDecisionByKey(options, "same-user");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.retryAfterSec > 0, true);
});

await run("runWithTimeout rejects long operations", async () => {
  await assert.rejects(
    () => runWithTimeout(10, () => new Promise((resolve) => setTimeout(resolve, 25))),
    (error: unknown) => error instanceof ResilienceError && error.code === "TIMEOUT"
  );
});

await run("runWithConcurrencyLimit rejects when scope is saturated", async () => {
  const pending = runWithConcurrencyLimit("unit-concurrency", 1, async () => {
    await new Promise((resolve) => setTimeout(resolve, 25));
    return true;
  });

  await assert.rejects(
    () => runWithConcurrencyLimit("unit-concurrency", 1, async () => true),
    (error: unknown) => error instanceof ResilienceError && error.code === "CONCURRENCY_LIMIT"
  );

  await pending;
});

await run("runWithCircuitBreaker opens after repeated failures", async () => {
  await assert.rejects(
    () =>
      runWithCircuitBreaker("unit-circuit", { failureThreshold: 1, cooldownMs: 60_000 }, async () => {
        throw new Error("boom");
      }),
    /boom/
  );

  await assert.rejects(
    () => runWithCircuitBreaker("unit-circuit", { failureThreshold: 1, cooldownMs: 60_000 }, async () => true),
    (error: unknown) => error instanceof ResilienceError && error.code === "CIRCUIT_OPEN"
  );
});

await run("attack monitor temporarily blocks repeated suspicious clients", () => {
  const key = `suspicious-${Date.now()}`;
  clearSuspicion(key);
  recordSuspiciousActivity(key, 3);
  const decision = getSuspicionDecision(key);
  assert.equal(decision.blocked, false);
  recordSuspiciousActivity(key, 3);
  const blocked = getSuspicionDecision(key);
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.retryAfterSec > 0, true);
});

await run("resilience snapshot exposes circuit state", async () => {
  const scope = `snapshot-circuit-${Date.now()}`;
  await assert.rejects(
    () =>
      runWithCircuitBreaker(scope, { failureThreshold: 1, cooldownMs: 60_000 }, async () => {
        throw new Error("boom");
      }),
    /boom/
  );

  const snapshot = getResilienceSnapshot();
  assert.equal(Boolean(snapshot.circuits[scope]), true);
  assert.equal(snapshot.circuits[scope]?.isOpen, true);
});

await run("getEnv rejects SMS_ENABLED without provider credentials", () => {
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

await run("getEnv rejects partial Turnstile configuration", () => {
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

await run("getEnv requires a canonical URL in production", () => {
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

await run("getEnv accepts valid minimal configuration", () => {
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

await run("social preview metadata constants stay aligned", () => {
  assert.equal(SOCIAL_IMAGE_PATH, "/images/hero.jpg");
  assert.equal(TWITTER_IMAGE_PATH, "/images/hero.jpg");
  assert.equal(SOCIAL_IMAGE_WIDTH, 1344);
  assert.equal(SOCIAL_IMAGE_HEIGHT, 768);
});

await run("sanitizeAssetReference rejects off-origin asset urls", () => {
  withEnv(
    {
      DATABASE_URL: "postgresql://example",
      SESSION_SECRET: "12345678901234567890123456789012",
      NEXT_PUBLIC_APP_URL: "https://clinic.example",
      SMS_ENABLED: "false",
      NODE_ENV: "development",
    },
    () => {
      assert.equal(sanitizeAssetReference("/images/hero.jpg"), "/images/hero.jpg");
      assert.equal(
        sanitizeAssetReference("https://clinic.example/images/hero.jpg"),
        "https://clinic.example/images/hero.jpg"
      );
      assert.equal(sanitizeAssetReference("https://evil.example/og.png"), "");
    }
  );
});

console.log(`Unit tests passed: ${results.length}`);
for (const result of results) {
  console.log(`- ${result}`);
}
