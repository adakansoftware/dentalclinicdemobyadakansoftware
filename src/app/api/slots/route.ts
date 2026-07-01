import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableSlotsWithMeta } from "@/lib/slots";
import { buildApiHeaders, getRequestIdFromHeaders, isAllowedBrowserOrigin } from "@/lib/api-security";
import { jsonError, jsonOk } from "@/lib/api-response";
import { compareDateStrings, getTodayDateInTurkey } from "@/lib/date";
import { buildRequestFingerprintFromHeaders, getRateLimitDecisionByKey } from "@/lib/security";
import { buildIpRateLimitKeyFromHeaders } from "@/lib/security-core";
import { getSuspicionDecision, recordSuspiciousActivity } from "@/lib/attack-monitor";
import { getDurationMs, logEvent } from "@/lib/observability";
import { ResilienceError, runWithCircuitBreaker, runWithConcurrencyLimit, runWithTimeout } from "@/lib/resilience";
import { methodNotAllowed } from "@/lib/route-methods";

export const dynamic = "force-dynamic";

const slotsQuerySchema = z.object({
  specialistId: z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, "Invalid specialist id"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export async function GET(request: Request) {
  const requestId = getRequestIdFromHeaders(request.headers);
  const startedAt = Date.now();
  const clientIpKey = buildIpRateLimitKeyFromHeaders(request.headers);
  const suspicionDecision = getSuspicionDecision(clientIpKey);

  if (suspicionDecision.blocked) {
    return jsonError("Suspicious traffic temporarily blocked", {
      requestId,
      status: 429,
      code: "SUSPICIOUS_TRAFFIC_BLOCKED",
      retryAfterSec: suspicionDecision.retryAfterSec,
    });
  }

  if (!isAllowedBrowserOrigin(request.headers, request.url, { requireHeaderInProduction: true })) {
    recordSuspiciousActivity(clientIpKey, 2);
    logEvent({
      level: "warn",
      event: "slots_origin_rejected",
      requestId,
      route: "/api/slots",
      meta: {
        origin: request.headers.get("origin") ?? undefined,
        referer: request.headers.get("referer") ?? undefined,
      },
    });

    return jsonError("Origin not allowed", {
      requestId,
      status: 403,
      code: "ORIGIN_NOT_ALLOWED",
    });
  }

  const { searchParams } = new URL(request.url);
  const parsed = slotsQuerySchema.safeParse({
    specialistId: searchParams.get("specialistId"),
    date: searchParams.get("date"),
  });

  if (!parsed.success) {
    recordSuspiciousActivity(clientIpKey, 1);
    logEvent({
      level: "warn",
      event: "slots_validation_failed",
      requestId,
      route: "/api/slots",
      meta: {
        issue: parsed.error.errors[0]?.message ?? "Invalid query",
      },
    });

    return jsonError(parsed.error.errors[0]?.message ?? "specialistId and date required", {
      requestId,
      status: 400,
      code: "INVALID_QUERY",
    });
  }

  if (compareDateStrings(parsed.data.date, getTodayDateInTurkey()) < 0) {
    return jsonError("Past dates are not allowed", {
      requestId,
      status: 400,
      code: "PAST_DATE",
    });
  }

  const maxAllowedDate = new Date();
  maxAllowedDate.setUTCDate(maxAllowedDate.getUTCDate() + 180);
  const maxAllowedDateString = maxAllowedDate.toISOString().slice(0, 10);

  if (compareDateStrings(parsed.data.date, maxAllowedDateString) > 0) {
    return jsonError("Date is too far in the future", {
      requestId,
      status: 400,
      code: "DATE_TOO_FAR",
    });
  }

  const fingerprint = buildRequestFingerprintFromHeaders(request.headers);
  const decision = getRateLimitDecisionByKey(
    {
      scope: "slots-api",
      limit: 40,
      windowMs: 60 * 1000,
    },
    fingerprint
  );

  if (!decision.allowed) {
    recordSuspiciousActivity(clientIpKey, 1);
    logEvent({
      level: "warn",
      event: "slots_rate_limited",
      requestId,
      route: "/api/slots",
      meta: {
        specialistId: parsed.data.specialistId,
        date: parsed.data.date,
      },
    });

    return jsonError("Too many requests", {
      requestId,
      status: 429,
      code: "RATE_LIMITED",
      retryAfterSec: decision.retryAfterSec || 60,
    });
  }

  const hotKeyDecision = getRateLimitDecisionByKey(
    {
      scope: "slots-api-target",
      limit: 12,
      windowMs: 60 * 1000,
      keySuffix: `${parsed.data.specialistId}:${parsed.data.date}`,
    },
    clientIpKey
  );

  if (!hotKeyDecision.allowed) {
    recordSuspiciousActivity(clientIpKey, 2);
    return jsonError("Too many requests for this schedule", {
      requestId,
      status: 429,
      code: "TARGET_RATE_LIMITED",
      retryAfterSec: hotKeyDecision.retryAfterSec || 60,
    });
  }

  try {
    const { slots, cacheHit } = await runWithCircuitBreaker(
      "api-slots",
      { failureThreshold: 4, cooldownMs: 30_000, halfOpenMaxConcurrent: 1 },
      () =>
        runWithConcurrencyLimit("api-slots", 20, () =>
          runWithTimeout(4_500, () => getAvailableSlotsWithMeta(parsed.data.specialistId, parsed.data.date))
        )
    );
    const durationMs = getDurationMs(startedAt);

    logEvent({
      event: "slots_fetched",
      requestId,
      route: "/api/slots",
      meta: {
        specialistId: parsed.data.specialistId,
        date: parsed.data.date,
        slotCount: slots.length,
        cacheHit,
        durationMs,
      },
    });

    return jsonOk(slots, {
      requestId,
      headers: {
        Vary: "Origin",
        "Server-Timing": `app;dur=${durationMs}`,
        "X-Slots-Cache": cacheHit ? "HIT" : "MISS",
      },
    });
  } catch (error) {
    if (error instanceof ResilienceError) {
      recordSuspiciousActivity(clientIpKey, error.code === "CIRCUIT_OPEN" ? 2 : 1);
      logEvent({
        level: "warn",
        event: "slots_backpressure_triggered",
        requestId,
        route: "/api/slots",
        message: error.message,
        meta: {
          code: error.code,
          specialistId: parsed.data.specialistId,
          date: parsed.data.date,
          durationMs: getDurationMs(startedAt),
        },
      });

      return jsonError("Service temporarily busy", {
        requestId,
        status: 503,
        code: error.code,
        retryAfterSec: 30,
      });
    }

    logEvent({
      level: "error",
      event: "slots_fetch_failed",
      requestId,
      route: "/api/slots",
      message: error instanceof Error ? error.message : "Unknown slots error",
      meta: {
        specialistId: parsed.data.specialistId,
        date: parsed.data.date,
        durationMs: getDurationMs(startedAt),
      },
    });

    return jsonError("Unable to fetch slots", {
      requestId,
      status: 400,
      code: "SLOTS_UNAVAILABLE",
    });
  }
}

export function POST(request: Request) {
  return methodNotAllowed(request, ["GET"]);
}

export function PUT(request: Request) {
  return methodNotAllowed(request, ["GET"]);
}

export function PATCH(request: Request) {
  return methodNotAllowed(request, ["GET"]);
}

export function DELETE(request: Request) {
  return methodNotAllowed(request, ["GET"]);
}
