import { prisma } from "@/lib/prisma";
import type { TimeSlot } from "@/types";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export async function getAvailableSlots(
  specialistId: string,
  dateStr: string
): Promise<TimeSlot[]> {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();

  const workingHour = await prisma.workingHour.findUnique({
    where: { specialistId_dayOfWeek: { specialistId, dayOfWeek } },
  });

  if (!workingHour || !workingHour.isOpen) {
    return [];
  }

  const blockedSlots = await prisma.blockedSlot.findMany({
    where: {
      specialistId,
      date: {
        gte: new Date(dateStr + "T00:00:00.000Z"),
        lte: new Date(dateStr + "T23:59:59.999Z"),
      },
    },
  });

  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      specialistId,
      date: {
        gte: new Date(dateStr + "T00:00:00.000Z"),
        lte: new Date(dateStr + "T23:59:59.999Z"),
      },
      status: { notIn: ["CANCELLED"] },
    },
  });

  const startMin = timeToMinutes(workingHour.startTime);
  const endMin = timeToMinutes(workingHour.endTime);
  const slotMin = workingHour.slotMinutes;

  const now = new Date();
  const isToday = dateStr === now.toISOString().split("T")[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: TimeSlot[] = [];

  for (let start = startMin; start + slotMin <= endMin; start += slotMin) {
    const end = start + slotMin;
    const startTime = minutesToTime(start);
    const endTime = minutesToTime(end);

    // Past time check
    if (isToday && start <= currentMinutes) {
      slots.push({ startTime, endTime, available: false });
      continue;
    }

    // Blocked check
    const isBlocked = blockedSlots.some((b) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return start < bEnd && end > bStart;
    });

    // Booked check
    const isBooked = bookedAppointments.some((a) => {
      const aStart = timeToMinutes(a.startTime);
      const aEnd = timeToMinutes(a.endTime);
      return start < aEnd && end > aStart;
    });

    slots.push({ startTime, endTime, available: !isBlocked && !isBooked });
  }

  return slots;
}

export async function checkSlotAvailability(
  specialistId: string,
  dateStr: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const slots = await getAvailableSlots(specialistId, dateStr);
  return slots.some(
    (s) => s.startTime === startTime && s.endTime === endTime && s.available
  );
}
