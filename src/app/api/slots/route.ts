import { NextResponse } from "next/server";
import { z } from "zod";
import { getAvailableSlotsWithMeta } from "@/lib/slots";
import { buildApiHeaders, getRequestIdFromHeaders, isAllowedBrowserOrigin } from "@/lib/api-security";
import { compareDateStrings, getTodayDateInTurkey } from "@/lib/date";
import { buildRequestFingerprintFromHeaders, enforceRateLimitByKey } from "@/lib/security";
import { getDurationMs, logEvent } from "@/lib/observability";

export const dynamic = "force-dynamic";

const slotsQuerySchema = z.object({
  specialistId: z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/, "Invalid specialist id"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

export async function GET(request: Request) {
  const requestId = getRequestIdFromHeaders(request.headers);
  const startedAt = Date.now();

  if (!isAllowedBrowserOrigin(request.headers, request.url, { requireHeaderInProduction: true })) {
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

    return NextResponse.json(
      { error: "Origin not allowed" },
      {
        status: 403,
        headers: buildApiHeaders(requestId),
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = slotsQuerySchema.safeParse({
    specialistId: searchParams.get("specialistId"),
    date: searchParams.get("date"),
  });

  if (!parsed.success) {
    logEvent({
      level: "warn",
      event: "slots_validation_failed",
      requestId,
      route: "/api/slots",
      meta: {
        issue: parsed.error.errors[0]?.message ?? "Invalid query",
      },
    });

    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "specialistId and date required" },
      {
        status: 400,
        headers: buildApiHeaders(requestId),
      }
    );
  }

  if (compareDateStrings(parsed.data.date, getTodayDateInTurkey()) < 0) {
    return NextResponse.json(
      { error: "Past dates are not allowed" },
      {
        status: 400,
        headers: buildApiHeaders(requestId),
      }
    );
  }

  const maxAllowedDate = new Date();
  maxAllowedDate.setUTCDate(maxAllowedDate.getUTCDate() + 180);
  const maxAllowedDateString = maxAllowedDate.toISOString().slice(0, 10);

  if (compareDateStrings(parsed.data.date, maxAllowedDateString) > 0) {
    return NextResponse.json(
      { error: "Date is too far in the future" },
      {
        status: 400,
        headers: buildApiHeaders(requestId),
      }
    );
  }

  const fingerprint = buildRequestFingerprintFromHeaders(request.headers);
  const allowed = enforceRateLimitByKey(
    {
      scope: "slots-api",
      limit: 60,
      windowMs: 60 * 1000,
    },
    fingerprint
  );

  if (!allowed) {
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

    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: buildApiHeaders(requestId, { "Retry-After": "60" }),
      }
    );
  }

  try {
    const { slots, cacheHit } = await getAvailableSlotsWithMeta(parsed.data.specialistId, parsed.data.date);
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

    return NextResponse.json(slots, {
      headers: buildApiHeaders(requestId, {
        Vary: "Origin",
        "Server-Timing": `app;dur=${durationMs}`,
        "X-Slots-Cache": cacheHit ? "HIT" : "MISS",
      }),
    });
  } catch (error) {
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

    return NextResponse.json(
      { error: "Unable to fetch slots" },
      {
        status: 400,
        headers: buildApiHeaders(requestId),
      }
    );
  }
}
