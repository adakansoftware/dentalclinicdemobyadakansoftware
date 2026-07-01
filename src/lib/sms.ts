import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";
import { logEvent } from "@/lib/observability";

const SMS_ENABLED = getEnv().SMS_ENABLED === "true";

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
  await prisma.smsLog.update({
    where: { id: logId },
    data: { status: "FAILED", errorMessage },
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
  const pendingLogs = await prisma.smsLog.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const result: SmsOutboxResult = {
    processed: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  for (const log of pendingLogs) {
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
