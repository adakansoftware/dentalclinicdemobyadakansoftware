import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";
import { logEvent } from "@/lib/observability";

const SMS_ENABLED = getEnv().SMS_ENABLED === "true";
const SMS_PROCESSING_PREFIX = "processing:";
const SMS_RETRY_PREFIX = "retry:";
const SMS_PROCESSING_LEASE_MS = 2 * 60 * 1000;
const SMS_RETRY_COOLDOWN_MS = 5 * 60 * 1000;
const SMS_MAX_RETRY_ATTEMPTS = 3;

interface SmsOptions {
  phone: string;
  message: string;
  appointmentId: string;
  type: "CONFIRMATION" | "REMINDER" | "CANCELLATION";
}

interface SmsOutboxResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}

type SmsRetryState =
  | { kind: "idle"; attempts: number; timestamp: number | null }
  | { kind: "processing"; attempts: number; timestamp: number | null };

export function buildConfirmationMessage(
  lang: "TR" | "EN",
  patientName: string,
  date: string,
  time: string,
  clinicName: string,
  phone: string
): string {
  if (lang === "EN") {
    return `Dear ${patientName}, your appointment at ${clinicName} on ${date} at ${time} has been confirmed. For info: ${phone}`;
  }

  return `Sayin ${patientName}, ${clinicName} kliniginde ${date} tarihinde saat ${time}'deki randevunuz onaylanmistir. Bilgi: ${phone}`;
}

export function buildReminderMessage(
  lang: "TR" | "EN",
  patientName: string,
  date: string,
  time: string,
  clinicName: string,
  phone: string
): string {
  if (lang === "EN") {
    return `Dear ${patientName}, this is a reminder for your appointment at ${clinicName} tomorrow (${date}) at ${time}. For info: ${phone}`;
  }

  return `Sayin ${patientName}, ${clinicName} klinigindeki yarinki randevunuzu (${date} - ${time}) hatirlatmak istedik. Bilgi: ${phone}`;
}

export function buildCancellationMessage(
  lang: "TR" | "EN",
  patientName: string,
  date: string,
  time: string,
  clinicName: string,
  phone: string
): string {
  if (lang === "EN") {
    return `Dear ${patientName}, your appointment at ${clinicName} on ${date} at ${time} has been cancelled. For info: ${phone}`;
  }

  return `Sayin ${patientName}, ${clinicName} kliniginde ${date} tarihinde saat ${time}'deki randevunuz iptal edilmistir. Bilgi: ${phone}`;
}

async function sendNetgsm(phone: string, message: string): Promise<string> {
  const env = getEnv();
  const username = env.NETGSM_USERNAME ?? "";
  const password = env.NETGSM_PASSWORD ?? "";
  const header = env.NETGSM_HEADER ?? "KLINIK";

  const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "90").replace(/^90/, "90");

  const url = new URL("https://api.netgsm.com.tr/sms/send/get/");
  url.searchParams.set("usercode", username);
  url.searchParams.set("password", password);
  url.searchParams.set("gsmno", cleanPhone);
  url.searchParams.set("message", message);
  url.searchParams.set("msgheader", header);

  const response = await fetch(url.toString(), { cache: "no-store" });
  const text = await response.text();
  const parts = text.trim().split(" ");
  const code = parts[0];

  if (code === "00" || code === "01" || code === "02") {
    return parts[1] ?? "sent";
  }

  throw new Error(`Netgsm error: ${text}`);
}

const smsOutboxRuntime = globalThis as typeof globalThis & {
  __adakanSmsOutboxPromise?: Promise<SmsOutboxResult> | null;
};

function buildProcessingMarker(now = Date.now()) {
  return `${SMS_PROCESSING_PREFIX}${now}`;
}

function buildRetryMarker(attempts: number, now = Date.now()) {
  return `${SMS_RETRY_PREFIX}${attempts}:${now}`;
}

export function getSmsRetryState(providerRef: string | null | undefined): SmsRetryState {
  const value = (providerRef ?? "").trim();
  if (!value) {
    return { kind: "idle", attempts: 0, timestamp: null };
  }

  if (value.startsWith(SMS_PROCESSING_PREFIX)) {
    const timestamp = Number(value.slice(SMS_PROCESSING_PREFIX.length));
    return {
      kind: "processing",
      attempts: 0,
      timestamp: Number.isFinite(timestamp) ? timestamp : null,
    };
  }

  if (value.startsWith(SMS_RETRY_PREFIX)) {
    const [attemptsRaw, timestampRaw] = value.slice(SMS_RETRY_PREFIX.length).split(":");
    const attempts = Number(attemptsRaw);
    const timestamp = Number(timestampRaw);
    return {
      kind: "idle",
      attempts: Number.isFinite(attempts) ? attempts : 0,
      timestamp: Number.isFinite(timestamp) ? timestamp : null,
    };
  }

  return { kind: "idle", attempts: 0, timestamp: null };
}

function shouldRetrySmsLog(providerRef: string | null | undefined, now = Date.now()) {
  const state = getSmsRetryState(providerRef);

  if (state.kind === "processing") {
    return state.timestamp !== null && now - state.timestamp >= SMS_PROCESSING_LEASE_MS;
  }

  if (state.attempts <= 0) {
    return true;
  }

  if (state.attempts >= SMS_MAX_RETRY_ATTEMPTS) {
    return false;
  }

  return state.timestamp !== null && now - state.timestamp >= SMS_RETRY_COOLDOWN_MS;
}

async function claimSmsLog(log: { id: string; status: "PENDING" | "FAILED"; providerRef: string }, now = Date.now()) {
  const nextMarker = buildProcessingMarker(now);
  const claimed = await prisma.smsLog.updateMany({
    where: {
      id: log.id,
      status: log.status,
      providerRef: log.providerRef,
    },
    data: {
      providerRef: nextMarker,
    },
  });

  return claimed.count === 1 ? nextMarker : null;
}

async function finalizeSmsLogSuccess(logId: string, providerRef: string) {
  const log = await prisma.smsLog.update({
    where: { id: logId },
    data: { status: "SENT", providerRef },
  });

  if (log.type === "REMINDER") {
    await prisma.appointment.update({
      where: { id: log.appointmentId },
      data: { smsSent: true },
    });
  }
}

async function finalizeSmsLogFailure(logId: string, errorMessage: string) {
  const existing = await prisma.smsLog.findUnique({
    where: { id: logId },
    select: { providerRef: true },
  });
  const previous = getSmsRetryState(existing?.providerRef);
  const attempts = previous.kind === "processing" ? Math.max(previous.attempts, 0) + 1 : previous.attempts + 1;

  await prisma.smsLog.update({
    where: { id: logId },
    data: {
      status: "FAILED",
      errorMessage,
      providerRef: buildRetryMarker(attempts),
    },
  });
}

export async function sendSms(options: SmsOptions): Promise<void> {
  const { phone, message, appointmentId, type } = options;

  const existing = await prisma.smsLog.findFirst({
    where: {
      appointmentId,
      type,
      status: { in: ["PENDING", "SENT"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!existing) {
    await prisma.smsLog.create({
      data: {
        appointmentId,
        phone,
        message,
        type,
        status: "PENDING",
      },
    });
  }

  void kickSmsOutboxProcessing();
}

export async function processSmsOutbox(limit = 10): Promise<SmsOutboxResult> {
  const candidateLogs = await prisma.smsLog.findMany({
    where: { status: { in: ["PENDING", "FAILED"] } },
    orderBy: { createdAt: "asc" },
    take: Math.max(limit * 3, limit),
  });

  const result: SmsOutboxResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  const now = Date.now();
  const runnableLogs = candidateLogs
    .filter(
      (log): log is typeof log & { status: "PENDING" | "FAILED" } =>
        (log.status === "PENDING" || log.status === "FAILED") && shouldRetrySmsLog(log.providerRef, now)
    )
    .slice(0, limit);

  for (const log of runnableLogs) {
    const claimMarker = await claimSmsLog(
      {
        id: log.id,
        status: log.status,
        providerRef: log.providerRef,
      },
      now
    );

    if (!claimMarker) {
      continue;
    }

    result.processed++;

    if (!SMS_ENABLED) {
      logEvent({
        event: "sms_skipped_disabled",
        route: "lib:sms",
        meta: {
          appointmentId: log.appointmentId,
          type: log.type,
          phone: log.phone,
        },
      });

      await finalizeSmsLogSuccess(log.id, "disabled");
      result.skipped++;
      continue;
    }

    try {
      const ref = await sendNetgsm(log.phone, log.message);
      await finalizeSmsLogSuccess(log.id, ref);
      result.sent++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await finalizeSmsLogFailure(log.id, errorMessage);

      logEvent({
        level: "error",
        event: "sms_send_failed",
        route: "lib:sms",
        message: errorMessage,
        meta: {
          appointmentId: log.appointmentId,
          type: log.type,
          phone: log.phone,
        },
      });

      result.failed++;
    }
  }

  return result;
}

export function kickSmsOutboxProcessing() {
  if (smsOutboxRuntime.__adakanSmsOutboxPromise) {
    return smsOutboxRuntime.__adakanSmsOutboxPromise;
  }

  smsOutboxRuntime.__adakanSmsOutboxPromise = processSmsOutbox().finally(() => {
    smsOutboxRuntime.__adakanSmsOutboxPromise = null;
  });

  return smsOutboxRuntime.__adakanSmsOutboxPromise;
}
