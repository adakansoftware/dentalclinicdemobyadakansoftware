import { NextResponse } from "next/server";
import { getRequestIdFromHeaders } from "@/lib/api-security";
import { jsonError, jsonOk } from "@/lib/api-response";
import { applyEndpointSuspicion, authorizeBearerSecret, checkEndpointRateLimit, getEndpointBlockDecision } from "@/lib/endpoint-guard";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { buildReminderMessage, processSmsOutbox, sendSms } from "@/lib/sms";
import { getEnv } from "@/lib/env";
import { dateToIsoDate, getTomorrowDateInTurkey, getUtcRangeForTurkeyDate } from "@/lib/date";
import { getDurationMs, logEvent } from "@/lib/observability";
import { ResilienceError, runWithCircuitBreaker, runWithConcurrencyLimit, runWithTimeout } from "@/lib/resilience";
import { methodNotAllowed } from "@/lib/route-methods";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestIdFromHeaders(request.headers);
  const startedAt = Date.now();
  const env = getEnv();
  const cronSecret = env.CRON_SECRET;
  const blockDecision = getEndpointBlockDecision(request.headers);

  if (blockDecision.blocked) {
    return jsonError("Too many suspicious requests", {
      requestId,
      status: 429,
      code: "SUSPICIOUS_TRAFFIC_BLOCKED",
      retryAfterSec: blockDecision.retryAfterSec,
    });
  }

  const rateDecision = checkEndpointRateLimit(request.headers, {
    scope: "cron-reminders-route",
    limit: 6,
    windowMs: 60 * 1000,
  });

  if (!rateDecision.allowed) {
    applyEndpointSuspicion(request.headers, 2);
    return jsonError("Too many requests", {
      requestId,
      status: 429,
      code: "RATE_LIMITED",
      retryAfterSec: rateDecision.retryAfterSec || 60,
    });
  }

  if (env.NODE_ENV === "production" && !cronSecret) {
    logEvent({
      level: "error",
      event: "cron_reminders_misconfigured",
      requestId,
      route: "/api/cron/reminders",
      message: "CRON_SECRET is missing in production",
    });

    return jsonError("CRON_SECRET is required in production", {
      requestId,
      status: 500,
      code: "CRON_MISCONFIGURED",
    });
  }

  const isAuthorized = authorizeBearerSecret(request.headers, cronSecret);

  if (!isAuthorized) {
    applyEndpointSuspicion(request.headers, 4);
    logEvent({
      level: "warn",
      event: "cron_reminders_unauthorized",
      requestId,
      route: "/api/cron/reminders",
      meta: {
        hasAuthorizationHeader: Boolean(request.headers.get("authorization")),
        durationMs: getDurationMs(startedAt),
      },
    });

    return jsonError("Unauthorized", {
      requestId,
      status: 401,
      code: "UNAUTHORIZED",
    });
  }

  const tomorrowDate = getTomorrowDateInTurkey();
  const { startUtc: tomorrow, endUtc: tomorrowEnd } = getUtcRangeForTurkeyDate(tomorrowDate);

  let appointments;

  try {
    appointments = await runWithCircuitBreaker(
      "cron-reminders",
      { failureThreshold: 3, cooldownMs: 60_000, halfOpenMaxConcurrent: 1 },
      () =>
        runWithConcurrencyLimit("cron-reminders", 1, () =>
          runWithTimeout(10_000, () =>
            prisma.appointment.findMany({
              where: {
                date: { gte: tomorrow, lte: tomorrowEnd },
                status: "CONFIRMED",
                smsSent: false,
              },
              include: { service: true, specialist: true },
            })
          )
        )
    );
  } catch (error) {
    if (error instanceof ResilienceError) {
      logEvent({
        level: "warn",
        event: "cron_reminders_backpressure_triggered",
        requestId,
        route: "/api/cron/reminders",
        message: error.message,
        meta: {
          code: error.code,
          durationMs: getDurationMs(startedAt),
        },
      });

      return jsonError("Reminder service temporarily unavailable", {
        requestId,
        status: 503,
        code: error.code,
        retryAfterSec: 60,
      });
    }

    throw error;
  }

  const settings = await getSiteSettings();
  let enqueued = 0;

  for (const apt of appointments) {
    try {
      const dateStr = dateToIsoDate(apt.date);
      const message = buildReminderMessage(
        apt.patientLanguage,
        apt.patientName,
        dateStr,
        apt.startTime,
        settings.clinicName,
        settings.phone
      );

      await sendSms({
        phone: apt.patientPhone,
        message,
        appointmentId: apt.id,
        type: "REMINDER",
      });
      enqueued++;
    } catch (err) {
      logEvent({
        level: "error",
        event: "cron_reminder_send_failed",
        requestId,
        route: "/api/cron/reminders",
        message: err instanceof Error ? err.message : "Unknown SMS error",
        meta: {
          appointmentId: apt.id,
          specialistId: apt.specialistId,
          serviceId: apt.serviceId,
        },
      });
    }
  }

  const outboxResult = await processSmsOutbox(Math.max(enqueued, 1));

  const durationMs = getDurationMs(startedAt);

  logEvent({
    event: "cron_reminders_completed",
    requestId,
    route: "/api/cron/reminders",
    meta: {
      total: appointments.length,
      enqueued,
      sent: outboxResult.sent,
      failed: outboxResult.failed,
      skipped: outboxResult.skipped,
      date: tomorrowDate,
      durationMs,
    },
  });

  return jsonOk(
    {
      success: true,
      total: appointments.length,
      enqueued,
      sent: outboxResult.sent,
      failed: outboxResult.failed,
      skipped: outboxResult.skipped,
      date: tomorrowDate,
      responseTimeMs: durationMs,
    },
    {
      requestId,
      headers: { "Server-Timing": `app;dur=${durationMs}` },
    }
  );
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
