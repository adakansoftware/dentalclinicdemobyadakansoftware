import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
import { sendSms, buildReminderMessage } from "@/lib/sms";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: {
      date: { gte: tomorrow, lte: tomorrowEnd },
      status: "CONFIRMED",
      smsSent: false,
    },
    include: { service: true, specialist: true },
  });

  const settings = await getSiteSettings();
  let sent = 0;
  let failed = 0;

  for (const apt of appointments) {
    try {
      const dateStr = apt.date.toISOString().split("T")[0] ?? "";
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
      console.error(`Failed to send reminder for appointment ${apt.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    total: appointments.length,
    sent,
    failed,
    date: tomorrow.toISOString().split("T")[0],
  });
}
