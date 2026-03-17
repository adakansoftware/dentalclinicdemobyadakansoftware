import { prisma } from "@/lib/prisma";

const SMS_ENABLED = process.env.SMS_ENABLED === "true";

interface SmsOptions {
  phone: string;
  message: string;
  appointmentId: string;
  type: "CONFIRMATION" | "REMINDER" | "CANCELLATION";
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
  return `Sayın ${patientName}, ${clinicName} kliniğinde ${date} tarihinde saat ${time}'deki randevunuz onaylanmıştır. Bilgi: ${phone}`;
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
  return `Sayın ${patientName}, ${clinicName} kliniğindeki yarınki randevunuzu (${date} - ${time}) hatırlatmak istedik. Bilgi: ${phone}`;
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
  return `Sayın ${patientName}, ${clinicName} kliniğinde ${date} tarihinde saat ${time}'deki randevunuz iptal edilmiştir. Bilgi: ${phone}`;
}

async function sendNetgsm(phone: string, message: string): Promise<string> {
  const username = process.env.NETGSM_USERNAME ?? "";
  const password = process.env.NETGSM_PASSWORD ?? "";
  const header = process.env.NETGSM_HEADER ?? "KLINIK";

  const cleanPhone = phone.replace(/\D/g, "").replace(/^0/, "90").replace(/^90/, "90");

  const url = new URL("https://api.netgsm.com.tr/sms/send/get/");
  url.searchParams.set("usercode", username);
  url.searchParams.set("password", password);
  url.searchParams.set("gsmno", cleanPhone);
  url.searchParams.set("message", message);
  url.searchParams.set("msgheader", header);

  const response = await fetch(url.toString());
  const text = await response.text();
  const parts = text.trim().split(" ");
  const code = parts[0];

  if (code === "00" || code === "01" || code === "02") {
    return parts[1] ?? "sent";
  }
  throw new Error(`Netgsm error: ${text}`);
}

export async function sendSms(options: SmsOptions): Promise<void> {
  const { phone, message, appointmentId, type } = options;

  const log = await prisma.smsLog.create({
    data: {
      appointmentId,
      phone,
      message,
      type,
      status: "PENDING",
    },
  });

  if (!SMS_ENABLED) {
    console.log(`[SMS DISABLED] To: ${phone}, Message: ${message}`);
    await prisma.smsLog.update({
      where: { id: log.id },
      data: { status: "SENT", providerRef: "disabled" },
    });
    return;
  }

  try {
    const ref = await sendNetgsm(phone, message);
    await prisma.smsLog.update({
      where: { id: log.id },
      data: { status: "SENT", providerRef: ref },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await prisma.smsLog.update({
      where: { id: log.id },
      data: { status: "FAILED", errorMessage },
    });
    console.error("SMS send failed:", errorMessage);
  }
}
