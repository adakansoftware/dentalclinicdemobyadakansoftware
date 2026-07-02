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
import {
  clearSuspicion,
  clearSuspicionAsync,
  getSuspicionDecision,
  getSuspicionDecisionAsync,
  recordSuspiciousActivity,
  recordSuspiciousActivityAsync,
} from "../src/lib/attack-monitor.ts";
import { authorizeBearerSecret } from "../src/lib/endpoint-guard.ts";
import { getEnv, resetEnvCacheForTests } from "../src/lib/env.ts";
import {
  buildRequestFingerprintFromHeaders,
  enforceRateLimitByKey,
  enforceRateLimitByKeyAsync,
  getRateLimitDecisionByKey,
  getRateLimitDecisionByKeyAsync,
  getClientIpFromHeadersSync,
  validateFormAge,
  validateHoneypot,
} from "../src/lib/security-core.ts";
import { getDurationMs } from "../src/lib/observability.ts";
import { ResilienceError, getResilienceSnapshot, runWithCircuitBreaker, runWithConcurrencyLimit, runWithTimeout } from "../src/lib/resilience.ts";
import { headersFromNodeRequest } from "../src/lib/request-headers.ts";
import { buildRequestUrlFromHeaders, isTrustedMutationOrigin } from "../src/lib/request-origin.ts";
import { buildActionReplayKey, claimActionReplay, claimActionReplayAsync } from "../src/lib/action-replay.ts";
import { createAdminStepUpProof, getAdminStepUpTtlSec, verifyAdminStepUpProof } from "../src/lib/admin-step-up.ts";
import {
  buildAdminSessionClientBinding,
  hashAdminSessionGuard,
  shouldInvalidateAdminSessionGuard,
  shouldRotateAdminSession,
} from "../src/lib/session-guard.ts";
import { SOCIAL_IMAGE_HEIGHT, SOCIAL_IMAGE_PATH, SOCIAL_IMAGE_WIDTH, TWITTER_IMAGE_PATH } from "../src/lib/social-preview.ts";
import { toAbsoluteAssetUrl } from "../src/lib/seo.ts";
import { sanitizeAssetReference } from "../src/lib/upload-assets.ts";
import { isIpAllowedByPolicy, parseIpAllowlist } from "../src/lib/ip-policy.ts";
import { claimDistributedLease, releaseDistributedLease } from "../src/lib/distributed-security-store.ts";

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

await run("parseIpAllowlist normalizes comma and newline separated entries", () => {
  assert.deepEqual(parseIpAllowlist("203.0.113.10, 198.51.100.0/24\n2001:db8::/32"), [
    "203.0.113.10",
    "198.51.100.0/24",
    "2001:db8::/32",
  ]);
});

await run("isIpAllowedByPolicy supports exact ip and cidr matching", () => {
  const allowlist = ["203.0.113.10", "198.51.100.0/24", "2001:db8::/32"];

  assert.equal(isIpAllowedByPolicy("203.0.113.10", allowlist), true);
  assert.equal(isIpAllowedByPolicy("198.51.100.77", allowlist), true);
  assert.equal(isIpAllowedByPolicy("2001:db8::5", allowlist), true);
  assert.equal(isIpAllowedByPolicy("203.0.113.11", allowlist), false);
  assert.equal(isIpAllowedByPolicy("2001:db9::1", allowlist), false);
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

await run("buildRequestUrlFromHeaders reconstructs forwarded request url safely", () => {
  const headerStore = new Headers({
    origin: "https://clinic.example",
  });

  assert.equal(buildRequestUrlFromHeaders(headerStore, "/admin"), "https://clinic.example/admin");
});

await run("isTrustedMutationOrigin rejects cross-site mutation hints", () => {
  withEnv(
    {
      DATABASE_URL: "postgresql://example",
      SESSION_SECRET: "12345678901234567890123456789012",
      NEXT_PUBLIC_APP_URL: "https://clinic.example",
      SMS_ENABLED: "false",
      NODE_ENV: "production",
    },
    () => {
      const trusted = new Headers({
        origin: "https://clinic.example",
        "sec-fetch-site": "same-origin",
      });
      const untrusted = new Headers({
        origin: "https://evil.example",
        "sec-fetch-site": "cross-site",
      });
      const spoofedHost = new Headers({
        origin: "https://evil.example",
        referer: "https://evil.example/admin",
        "sec-fetch-site": "same-origin",
      });

      assert.equal(isTrustedMutationOrigin(trusted, "/admin/settings"), true);
      assert.equal(isTrustedMutationOrigin(untrusted, "/admin/settings"), false);
      assert.equal(isTrustedMutationOrigin(spoofedHost, "/admin/settings"), false);
    }
  );
});

await run("buildAdminSessionClientBinding combines stable browser hints", () => {
  const headerStore = new Headers({
    "user-agent": "Mozilla/5.0",
    "accept-language": "tr-TR,tr;q=0.9",
  });

  assert.equal(buildAdminSessionClientBinding(headerStore), "Mozilla/5.0|tr-TR,tr;q=0.9");
});

await run("admin session guard hash rejects mismatched client binding", () => {
  const validGuard = hashAdminSessionGuard("token-1", "binding-1", "secret-1");

  assert.equal(shouldInvalidateAdminSessionGuard("token-1", "binding-1", validGuard, "secret-1"), false);
  assert.equal(shouldInvalidateAdminSessionGuard("token-1", "binding-2", validGuard, "secret-1"), true);
});

await run("admin step-up proof validates only within ttl", () => {
  const issuedAtSec = Math.floor(Date.now() / 1000);
  const proof = createAdminStepUpProof("admin-1", issuedAtSec, "secret-1");

  assert.equal(verifyAdminStepUpProof("admin-1", proof, Date.now(), "secret-1"), true);
  assert.equal(
    verifyAdminStepUpProof("admin-1", proof, Date.now() + (getAdminStepUpTtlSec() + 5) * 1000, "secret-1"),
    false
  );
});

await run("action replay guard rejects immediate duplicate claims", () => {
  const key = buildActionReplayKey(`unit-replay-${Date.now()}`, ["same", "payload"]);
  const first = claimActionReplay(key, 60_000);
  const second = claimActionReplay(key, 60_000);

  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
});

await run("async action replay guard preserves duplicate detection with fallback store", async () => {
  const key = buildActionReplayKey(`unit-replay-async-${Date.now()}`, ["same", "payload"]);
  const first = await claimActionReplayAsync(key, 60_000);
  const second = await claimActionReplayAsync(key, 60_000);

  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
});


await run("shouldRotateAdminSession flags stale sessions", () => {
  const createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
  assert.equal(shouldRotateAdminSession(createdAt, Date.now()), true);
  assert.equal(shouldRotateAdminSession(new Date(), Date.now()), false);
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

await run("getRateLimitDecisionByKey keeps caller key and contextual key together", () => {
  const scope = `unit-test-composite-${Date.now()}`;
  const options = { scope, limit: 1, windowMs: 60_000, keySuffix: "shared-context" };

  const firstClient = getRateLimitDecisionByKey(options, "client-a");
  const secondClient = getRateLimitDecisionByKey(options, "client-b");

  assert.equal(firstClient.allowed, true);
  assert.equal(secondClient.allowed, true);
});

await run("async rate limit guard preserves retry metadata with fallback store", async () => {
  const scope = `unit-test-adaptive-async-${Date.now()}`;
  const options = { scope, limit: 1, windowMs: 60_000 };

  assert.equal((await getRateLimitDecisionByKeyAsync(options, "same-user")).allowed, true);
  const blocked = await getRateLimitDecisionByKeyAsync(options, "same-user");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.retryAfterSec > 0, true);
  assert.equal(await enforceRateLimitByKeyAsync({ scope: `${scope}-other`, limit: 1, windowMs: 60_000 }, "ok"), true);
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

await run("async attack monitor shares suspicion semantics with fallback store", async () => {
  const key = `suspicious-async-${Date.now()}`;
  await clearSuspicionAsync(key);
  await recordSuspiciousActivityAsync(key, 3);
  const decision = await getSuspicionDecisionAsync(key);
  assert.equal(decision.blocked, false);
  await recordSuspiciousActivityAsync(key, 3);
  const blocked = await getSuspicionDecisionAsync(key);
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.retryAfterSec > 0, true);
  await clearSuspicionAsync(key);
});

await run("distributed lease fallback allows acquire and release semantics", async () => {
  const key = `lease-${Date.now()}`;
  const first = await claimDistributedLease(key, 60_000, "owner-a", "unit-lease");
  const second = await claimDistributedLease(key, 60_000, "owner-b", "unit-lease");

  assert.equal(first.claimed, true);
  assert.equal(second.claimed, true);

  await releaseDistributedLease(key, "owner-a", "unit-lease");
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

await run("getEnv accepts optional ip allowlists", () => {
  withEnv(
    {
      DATABASE_URL: "postgresql://example",
      SESSION_SECRET: "12345678901234567890123456789012",
      SMS_ENABLED: "false",
      NEXT_PUBLIC_APP_URL: "https://clinic.example",
      ADMIN_IP_ALLOWLIST: "203.0.113.10,198.51.100.0/24",
      INTERNAL_API_IP_ALLOWLIST: "10.0.0.0/8",
      NODE_ENV: "development",
    },
    () => {
      const env = getEnv();
      assert.equal(env.ADMIN_IP_ALLOWLIST, "203.0.113.10,198.51.100.0/24");
      assert.equal(env.INTERNAL_API_IP_ALLOWLIST, "10.0.0.0/8");
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

await run("toAbsoluteAssetUrl keeps hero image as the canonical social fallback", () => {
  withEnv(
    {
      DATABASE_URL: "postgresql://example",
      SESSION_SECRET: "12345678901234567890123456789012",
      NEXT_PUBLIC_APP_URL: "https://clinic.example",
      SMS_ENABLED: "false",
      NODE_ENV: "development",
    },
    () => {
      assert.equal(toAbsoluteAssetUrl(SOCIAL_IMAGE_PATH), "https://clinic.example/images/hero.jpg");
      assert.equal(toAbsoluteAssetUrl(TWITTER_IMAGE_PATH), "https://clinic.example/images/hero.jpg");
    }
  );
});

console.log(`Unit tests passed: ${results.length}`);
for (const result of results) {
  console.log(`- ${result}`);
}
