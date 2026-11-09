import { test } from "vitest";
import assert from "node:assert/strict";
import { buildHealthSummary } from "@/lib/health";
import { canTransitionAppointmentStatus, getAllowedAppointmentTransitions } from "@/lib/appointment-state";
import { isStatusBlockingSlot, timesOverlap } from "@/lib/appointment-conflicts";
import { getRequestIdFromHeaders } from "@/lib/api-security";
import { BackendError, isBackendError } from "@/lib/backend-errors";
import {
  clearSuspicion,
  clearSuspicionAsync,
  getSuspicionDecision,
  getSuspicionDecisionAsync,
  recordSuspiciousActivity,
  recordSuspiciousActivityAsync,
} from "@/lib/attack-monitor";
import { authorizeBearerSecret } from "@/lib/endpoint-guard";
import { getEnv, resetEnvCacheForTests } from "@/lib/env";
import {
  enforceRateLimitByKeyAsync,
  getRateLimitDecisionByKey,
  getRateLimitDecisionByKeyAsync,
} from "@/lib/security-core";
import { getDurationMs } from "@/lib/observability";
import { ResilienceError, getResilienceSnapshot, runWithCircuitBreaker, runWithConcurrencyLimit, runWithTimeout } from "@/lib/resilience";
import { headersFromNodeRequest } from "@/lib/request-headers";
import { buildRequestUrlFromHeaders, isTrustedMutationOrigin } from "@/lib/request-origin";
import { buildActionReplayKey, claimActionReplay, claimActionReplayAsync } from "@/lib/action-replay";
import { createAdminStepUpProof, getAdminStepUpTtlSec, verifyAdminStepUpProof } from "@/lib/admin-step-up";
import {
  buildAdminSessionClientBinding,
  hashAdminSessionGuard,
  shouldInvalidateAdminSessionGuard,
  shouldRotateAdminSession,
} from "@/lib/session-guard";
import { sanitizeAssetReference } from "@/lib/upload-assets";
import { isIpAllowedByPolicy, parseIpAllowlist } from "@/lib/ip-policy";
import { claimDistributedLease, releaseDistributedLease } from "@/lib/distributed-security-store";

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

test("parseIpAllowlist normalizes comma and newline separated entries", () => {
  assert.deepEqual(parseIpAllowlist("203.0.113.10, 198.51.100.0/24\n2001:db8::/32"), [
    "203.0.113.10",
    "198.51.100.0/24",
    "2001:db8::/32",
  ]);
});

test("isIpAllowedByPolicy supports exact ip and cidr matching", () => {
  const allowlist = ["203.0.113.10", "198.51.100.0/24", "2001:db8::/32"];

  assert.equal(isIpAllowedByPolicy("203.0.113.10", allowlist), true);
  assert.equal(isIpAllowedByPolicy("198.51.100.77", allowlist), true);
  assert.equal(isIpAllowedByPolicy("2001:db8::5", allowlist), true);
  assert.equal(isIpAllowedByPolicy("203.0.113.11", allowlist), false);
  assert.equal(isIpAllowedByPolicy("2001:db9::1", allowlist), false);
});

test("getRequestIdFromHeaders rejects invalid request ids", () => {
  const invalid = new Headers({
    "x-request-id": "bad value with spaces",
  });
  const valid = new Headers({
    "x-request-id": "req-demo-12345",
  });

  assert.equal(getRequestIdFromHeaders(valid), "req-demo-12345");
  assert.equal(/^[a-zA-Z0-9._:-]{8,120}$/.test(getRequestIdFromHeaders(invalid)), true);
});

test("headersFromNodeRequest normalizes string arrays", () => {
  const headers = headersFromNodeRequest({
    authorization: ["Bearer one", "Bearer two"],
    "x-test": "value",
  });

  assert.equal(headers.get("authorization"), "Bearer one, Bearer two");
  assert.equal(headers.get("x-test"), "value");
});

test("buildRequestUrlFromHeaders reconstructs forwarded request url safely", () => {
  const headerStore = new Headers({
    origin: "https://clinic.example",
  });

  assert.equal(buildRequestUrlFromHeaders(headerStore, "/admin"), "https://clinic.example/admin");
});

test("isTrustedMutationOrigin rejects cross-site mutation hints", () => {
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

test("buildAdminSessionClientBinding combines stable browser hints", () => {
  const headerStore = new Headers({
    "user-agent": "Mozilla/5.0",
    "accept-language": "tr-TR,tr;q=0.9",
  });

  assert.equal(buildAdminSessionClientBinding(headerStore), "Mozilla/5.0|tr-TR,tr;q=0.9");
});

test("admin session guard hash rejects mismatched client binding", () => {
  const validGuard = hashAdminSessionGuard("token-1", "binding-1", "secret-1");

  assert.equal(shouldInvalidateAdminSessionGuard("token-1", "binding-1", validGuard, "secret-1"), false);
  assert.equal(shouldInvalidateAdminSessionGuard("token-1", "binding-2", validGuard, "secret-1"), true);
});

test("admin step-up proof validates only within ttl", () => {
  const issuedAtSec = Math.floor(Date.now() / 1000);
  const proof = createAdminStepUpProof("admin-1", issuedAtSec, "secret-1");

  assert.equal(verifyAdminStepUpProof("admin-1", proof, Date.now(), "secret-1"), true);
  assert.equal(
    verifyAdminStepUpProof("admin-1", proof, Date.now() + (getAdminStepUpTtlSec() + 5) * 1000, "secret-1"),
    false
  );
});

test("action replay guard rejects immediate duplicate claims", () => {
  const key = buildActionReplayKey(`unit-replay-${Date.now()}`, ["same", "payload"]);
  const first = claimActionReplay(key, 60_000);
  const second = claimActionReplay(key, 60_000);

  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
});

test("async action replay guard preserves duplicate detection with fallback store", async () => {
  const key = buildActionReplayKey(`unit-replay-async-${Date.now()}`, ["same", "payload"]);
  const first = await claimActionReplayAsync(key, 60_000);
  const second = await claimActionReplayAsync(key, 60_000);

  assert.equal(first.duplicate, false);
  assert.equal(second.duplicate, true);
});

test("shouldRotateAdminSession flags stale sessions", () => {
  const createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
  assert.equal(shouldRotateAdminSession(createdAt, Date.now()), true);
  assert.equal(shouldRotateAdminSession(new Date(), Date.now()), false);
});

test("authorizeBearerSecret validates bearer tokens safely", () => {
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

test("getDurationMs never returns negative values", () => {
  assert.equal(getDurationMs(Date.now() + 1000), 0);
});

test("timesOverlap detects overlapping slots but allows edge-aligned slots", () => {
  assert.equal(timesOverlap("09:00", "09:30", "09:15", "09:45"), true);
  assert.equal(timesOverlap("09:00", "09:30", "09:30", "10:00"), false);
  assert.equal(timesOverlap("10:00", "10:30", "09:30", "10:00"), false);
});

test("isStatusBlockingSlot only blocks active booking states", () => {
  assert.equal(isStatusBlockingSlot("PENDING"), true);
  assert.equal(isStatusBlockingSlot("CONFIRMED"), true);
  assert.equal(isStatusBlockingSlot("CANCELLED"), false);
  assert.equal(isStatusBlockingSlot("COMPLETED"), false);
});

test("appointment transition rules allow only supported status changes", () => {
  assert.deepEqual(getAllowedAppointmentTransitions("PENDING"), ["CONFIRMED", "CANCELLED"]);
  assert.equal(canTransitionAppointmentStatus("PENDING", "COMPLETED"), false);
  assert.equal(canTransitionAppointmentStatus("CANCELLED", "CONFIRMED"), true);
  assert.equal(canTransitionAppointmentStatus("COMPLETED", "PENDING"), false);
});

test("BackendError helpers preserve typed backend error codes", () => {
  const error = new BackendError("SLOT_UNAVAILABLE", "Slot is already booked", {
    specialistId: "spec-1",
  });

  assert.equal(isBackendError(error), true);
  assert.equal(isBackendError(error, "SLOT_UNAVAILABLE"), true);
  assert.equal(isBackendError(error, "APPOINTMENT_NOT_FOUND"), false);
  assert.equal(isBackendError(new BackendError("CONTACT_REQUEST_NOT_FOUND")), true);
  assert.equal(isBackendError(new Error("plain error")), false);
});

test("buildHealthSummary returns warn when configuration is incomplete", () => {
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

test("buildHealthSummary returns error when database is down", () => {
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

test("getRateLimitDecisionByKey returns retry information after repeated abuse", () => {
  const scope = `unit-test-adaptive-${Date.now()}`;
  const options = { scope, limit: 1, windowMs: 60_000 };

  assert.equal(getRateLimitDecisionByKey(options, "same-user").allowed, true);
  const blocked = getRateLimitDecisionByKey(options, "same-user");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.retryAfterSec > 0, true);
});

test("getRateLimitDecisionByKey keeps caller key and contextual key together", () => {
  const scope = `unit-test-composite-${Date.now()}`;
  const options = { scope, limit: 1, windowMs: 60_000, keySuffix: "shared-context" };

  const firstClient = getRateLimitDecisionByKey(options, "client-a");
  const secondClient = getRateLimitDecisionByKey(options, "client-b");

  assert.equal(firstClient.allowed, true);
  assert.equal(secondClient.allowed, true);
});

test("async rate limit guard preserves retry metadata with fallback store", async () => {
  const scope = `unit-test-adaptive-async-${Date.now()}`;
  const options = { scope, limit: 1, windowMs: 60_000 };

  assert.equal((await getRateLimitDecisionByKeyAsync(options, "same-user")).allowed, true);
  const blocked = await getRateLimitDecisionByKeyAsync(options, "same-user");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.retryAfterSec > 0, true);
  assert.equal(await enforceRateLimitByKeyAsync({ scope: `${scope}-other`, limit: 1, windowMs: 60_000 }, "ok"), true);
});

test("runWithTimeout rejects long operations", async () => {
  await assert.rejects(
    () => runWithTimeout(10, () => new Promise((resolve) => setTimeout(resolve, 25))),
    (error: unknown) => error instanceof ResilienceError && error.code === "TIMEOUT"
  );
});

test("runWithConcurrencyLimit rejects when scope is saturated", async () => {
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

test("runWithCircuitBreaker opens after repeated failures", async () => {
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

test("attack monitor temporarily blocks repeated suspicious clients", () => {
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

test("async attack monitor shares suspicion semantics with fallback store", async () => {
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

test("distributed lease fallback allows acquire and release semantics", async () => {
  const key = `lease-${Date.now()}`;
  const first = await claimDistributedLease(key, 60_000, "owner-a", "unit-lease");
  const second = await claimDistributedLease(key, 60_000, "owner-b", "unit-lease");

  assert.equal(first.claimed, true);
  assert.equal(second.claimed, true);

  await releaseDistributedLease(key, "owner-a", "unit-lease");
});

test("resilience snapshot exposes circuit state", async () => {
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

test("getEnv rejects SMS_ENABLED without provider credentials", () => {
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

test("getEnv rejects partial Turnstile configuration", () => {
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

test("getEnv requires a canonical URL in production", () => {
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

test("getEnv accepts valid minimal configuration", () => {
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

test("getEnv accepts optional ip allowlists", () => {
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

test("sanitizeAssetReference rejects off-origin asset urls", () => {
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
