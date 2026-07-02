import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getEnvIssues, getOptionalEnv } from "@/lib/env";
import { getDurationMs, logEvent } from "@/lib/observability";
import { buildApiHeaders } from "@/lib/api-security";
import { buildHealthSummary } from "@/lib/health";
import { isRequestIpAllowed, parseIpAllowlist } from "@/lib/ip-policy";
import { getResilienceSnapshot, ResilienceError, runWithCircuitBreaker, runWithTimeout } from "@/lib/resilience";
import {
  applyEndpointSuspicionAsync,
  authorizeBearerSecret,
  checkEndpointRateLimitAsync,
  getEndpointBlockDecisionAsync,
} from "@/lib/endpoint-guard";
import { headersFromNodeRequest } from "@/lib/request-headers";

function buildRequestId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getRequestId(req: NextApiRequest) {
  const headerValue = typeof req.headers["x-request-id"] === "string" ? req.headers["x-request-id"].trim() : "";
  return /^[a-zA-Z0-9._:-]{8,120}$/.test(headerValue) ? headerValue : buildRequestId();
}

function applyApiHeaders(res: NextApiResponse, requestId: string, extras: Record<string, string> = {}) {
  const headers = buildApiHeaders(requestId, extras);
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = getRequestId(req);
  const startedAt = Date.now();
  const env = getOptionalEnv();
  const isProduction = process.env.NODE_ENV === "production";
  const healthcheckSecret = env.HEALTHCHECK_SECRET;
  const requestHeaders = headersFromNodeRequest(req.headers);
  const internalApiAllowlist = parseIpAllowlist(env.INTERNAL_API_IP_ALLOWLIST);

  if (req.method !== "GET") {
    applyApiHeaders(res, requestId, { Allow: "GET" });
    return res.status(405).json({ error: "Method Not Allowed", requestId });
  }

  const blockDecision = await getEndpointBlockDecisionAsync(requestHeaders);
  if (blockDecision.blocked) {
    applyApiHeaders(res, requestId, { "Retry-After": String(blockDecision.retryAfterSec) });
    return res.status(429).json({ error: "Too many suspicious requests", requestId });
  }

  if (internalApiAllowlist.length > 0 && !isRequestIpAllowed(requestHeaders, internalApiAllowlist)) {
    await applyEndpointSuspicionAsync(requestHeaders, 2);
    applyApiHeaders(res, requestId);
    return res.status(404).json({ error: "Not Found", requestId });
  }

  const rateDecision = await checkEndpointRateLimitAsync(requestHeaders, {
    scope: "health-route",
    limit: isProduction ? 20 : 60,
    windowMs: 60 * 1000,
  });

  if (!rateDecision.allowed) {
    await applyEndpointSuspicionAsync(requestHeaders, 1);
    applyApiHeaders(res, requestId, { "Retry-After": String(rateDecision.retryAfterSec || 60) });
    return res.status(429).json({ error: "Too many requests", requestId });
  }

  if (isProduction) {
    const isAuthorized = authorizeBearerSecret(requestHeaders, healthcheckSecret);

    if (!isAuthorized) {
      await applyEndpointSuspicionAsync(requestHeaders, 3);
      logEvent({
        level: "warn",
        event: "health_check_unauthorized",
        requestId,
        route: "/api/health",
        meta: {
          hasAuthorizationHeader: Boolean(req.headers.authorization),
          durationMs: getDurationMs(startedAt),
        },
      });

      applyApiHeaders(res, requestId);
      return res.status(404).json({ error: "Not Found", requestId });
    }
  }

  try {
    const [_, hardeningRows] = await runWithCircuitBreaker(
      "health-route",
      { failureThreshold: 3, cooldownMs: 30_000, halfOpenMaxConcurrent: 1 },
      () =>
        runWithTimeout(4_000, () =>
          Promise.all([
            prisma.$queryRaw`SELECT 1`,
            prisma.$queryRaw<Array<{ indexname: string }>>`
              SELECT indexname
              FROM pg_indexes
              WHERE schemaname = 'public'
                AND tablename = 'Appointment'
                AND indexname = 'appointment_active_slot_unique'
            `,
          ])
        )
    );
    const envIssues = getEnvIssues();
    const isEnvReady = envIssues.length === 0;
    const durationMs = getDurationMs(startedAt);
    const hasCanonicalUrl = Boolean(
      env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_SITE_URL || env.NEXTAUTH_URL || env.VERCEL_PROJECT_PRODUCTION_URL
    );
    const turnstileConfigured = Boolean(env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
    const cronConfigured = Boolean(env.CRON_SECRET);
    const smsEnabled = env.SMS_ENABLED === "true";
    const dbHardeningConfigured = hardeningRows.length > 0;
    const resilience = getResilienceSnapshot();
    const resilienceSummary = {
      openCircuitCount: Object.values(resilience.circuits).filter((c) => c.isOpen).length,
      activeConcurrencyScopes: Object.keys(resilience.concurrency).length,
    };
    const summary = buildHealthSummary({
      databaseOk: true,
      envIssues,
      smsEnabled,
      hasCanonicalUrl,
      turnstileConfigured,
      cronConfigured,
      dbHardeningConfigured,
    });

    logEvent({
      event: "health_check_ok",
      requestId,
      route: "/api/health",
      meta: {
        durationMs,
        envReady: isEnvReady,
        envIssueCount: envIssues.length,
        smsEnabled,
        hasCanonicalUrl,
        turnstileConfigured,
        cronConfigured,
        dbHardeningConfigured,
        openCircuitCount: resilienceSummary.openCircuitCount,
        healthStatus: summary.status,
      },
    });

    applyApiHeaders(res, requestId, {
      "Server-Timing": `app;dur=${durationMs}`,
      "X-Health-Status": summary.status,
    });
    return res.status(200).json({
      ok: true,
      database: "up",
      status: summary.status,
      checks: summary.checks,
      envReady: isEnvReady,
      envWarnings: envIssues,
      smsEnabled,
      appUrlConfigured: hasCanonicalUrl,
      turnstileConfigured,
      cronConfigured,
      resilience: isProduction ? resilienceSummary : resilience,
      environment: process.env.NODE_ENV ?? "development",
      requestId,
      responseTimeMs: durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const durationMs = getDurationMs(startedAt);
    const summary = buildHealthSummary({
      databaseOk: false,
      envIssues: [],
      smsEnabled: false,
      hasCanonicalUrl: false,
      turnstileConfigured: false,
      cronConfigured: false,
      dbHardeningConfigured: false,
    });

    logEvent({
      level: error instanceof ResilienceError ? "warn" : "error",
      event: "health_check_failed",
      requestId,
      route: "/api/health",
      message: error instanceof Error ? error.message : "Unknown error",
      meta: {
        durationMs,
        code: error instanceof ResilienceError ? error.code : undefined,
      },
    });

    applyApiHeaders(res, requestId, {
      "Server-Timing": `app;dur=${durationMs}`,
      "X-Health-Status": summary.status,
    });
    return res.status(error instanceof ResilienceError ? 503 : 500).json({
      ok: false,
      database: "down",
      status: summary.status,
      checks: summary.checks,
      error: isProduction ? "Health check failed" : error instanceof Error ? error.message : "Unknown error",
      requestId,
      responseTimeMs: durationMs,
      timestamp: new Date().toISOString(),
    });
  }
}
