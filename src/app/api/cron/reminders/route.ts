import { NextResponse } from "next/server";
import { buildApiHeaders, getRequestIdFromHeaders, secureCompare } from "@/lib/api-security";
import { jsonError, jsonOk } from "@/lib/api-response";
import { buildIpRateLimitKeyFromHeaders } from "@/lib/security-core";
import { recordSuspiciousActivity } from "@/lib/attack-monitor";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { buildReminderMessage, sendSms } from "@/lib/sms";
import { getEnv } from "@/lib/env";
import { dateToIsoDate, getTomorrowDateInTurkey, getUtcRangeForTurkeyDate } from "@/lib/date";
import { getDurationMs, logEvent } from "@/lib/observability";
import { ResilienceError, runWithCircuitBreaker, runWithConcurrencyLimit, runWithTimeout } from "@/lib/resilience";
import { methodNotAllowed } from "@/lib/route-methods";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestIdFromHeaders(request.headers);
  const startedAt = Date.now();
  const authHeader = request.headers.get("authorization");
  const env = getEnv();
  const cronSecret = env.CRON_SECRET;

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

  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  const isAuthorized = secureCompare(cronSecret, bearerToken);

  if (!isAuthorized) {
    recordSuspiciousActivity(buildIpRateLimitKeyFromHeaders(request.headers), 4);
    logEvent({
      level: "warn",
      event: "cron_reminders_unauthorized",
      requestId,
      route: "/api/cron/reminders",
      meta: {
        hasAuthorizationHeader: Boolean(authHeader),
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
  let sent = 0;
  let failed = 0;

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

      await prisma.appointment.update({
        where: { id: apt.id },
        data: { smsSent: true },
      });

      sent++;
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
      failed++;
    }
  }

  const durationMs = getDurationMs(startedAt);

  logEvent({
    event: "cron_reminders_completed",
    requestId,
    route: "/api/cron/reminders",
    meta: {
      total: appointments.length,
      sent,
      failed,
      date: tomorrowDate,
      durationMs,
    },
  });

  return jsonOk(
    {
      success: true,
      total: appointments.length,
      sent,
      failed,
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
