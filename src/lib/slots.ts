import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withDistributedSecurityState } from "@/lib/distributed-security-store";
import {
  compareDateStrings,
  getCurrentMinutesInTurkey,
  getDayOfWeekFromDate,
  getTodayDateInTurkey,
  getUtcRangeForTurkeyDate,
} from "@/lib/date";
import type { TimeSlot } from "@/types";

type SlotDb = PrismaClient | Prisma.TransactionClient;
export interface SlotsResult {
  slots: TimeSlot[];
  cacheHit: boolean;
}

const globalSlotCache = globalThis as typeof globalThis & {
  __adakanSlotsCache?: Map<string, { expiresAt: number; slots: TimeSlot[] }>;
  __adakanSlotsInFlight?: Map<string, Promise<SlotsResult>>;
};
const slotsCache = globalSlotCache.__adakanSlotsCache ?? new Map<string, { expiresAt: number; slots: TimeSlot[] }>();
const slotsInFlight = globalSlotCache.__adakanSlotsInFlight ?? new Map<string, Promise<SlotsResult>>();
globalSlotCache.__adakanSlotsCache = slotsCache;
globalSlotCache.__adakanSlotsInFlight = slotsInFlight;
const SLOTS_CACHE_TTL_MS = 15_000;
const SLOTS_CACHE_MAX_KEYS = 500;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export async function getAvailableSlotsFromDb(
  db: SlotDb,
  specialistId: string,
  dateStr: string
): Promise<TimeSlot[]> {
  const dayOfWeek = getDayOfWeekFromDate(dateStr);

  const workingHour = await db.workingHour.findUnique({
    where: { specialistId_dayOfWeek: { specialistId, dayOfWeek } },
  });

  if (!workingHour || !workingHour.isOpen) {
    return [];
  }

  const { startUtc, endUtc } = getUtcRangeForTurkeyDate(dateStr);

  const [blockedSlots, bookedAppointments] = await Promise.all([
    db.blockedSlot.findMany({
      where: {
        specialistId,
        date: {
          gte: startUtc,
          lte: endUtc,
        },
      },
    }),
    db.appointment.findMany({
      where: {
        specialistId,
        date: {
          gte: startUtc,
          lte: endUtc,
        },
        status: { notIn: ["CANCELLED"] },
      },
    }),
  ]);

  const startMin = timeToMinutes(workingHour.startTime);
  const endMin = timeToMinutes(workingHour.endTime);
  const slotMin = workingHour.slotMinutes;

  if (slotMin <= 0 || endMin <= startMin) {
    return [];
  }

  const todayInTurkey = getTodayDateInTurkey();
  const currentMinutes = getCurrentMinutesInTurkey();
  const isPastDate = compareDateStrings(dateStr, todayInTurkey) < 0;
  const isToday = dateStr === todayInTurkey;

  const slots: TimeSlot[] = [];

  for (let start = startMin; start + slotMin <= endMin; start += slotMin) {
    const end = start + slotMin;
    const startTime = minutesToTime(start);
    const endTime = minutesToTime(end);

    if (isPastDate || (isToday && start <= currentMinutes)) {
      slots.push({ startTime, endTime, available: false });
      continue;
    }

    const isBlocked = blockedSlots.some((blockedSlot) => {
      const blockedStart = timeToMinutes(blockedSlot.startTime);
      const blockedEnd = timeToMinutes(blockedSlot.endTime);
      return start < blockedEnd && end > blockedStart;
    });

    const isBooked = bookedAppointments.some((appointment) => {
      const appointmentStart = timeToMinutes(appointment.startTime);
      const appointmentEnd = timeToMinutes(appointment.endTime);
      return start < appointmentEnd && end > appointmentStart;
    });

    slots.push({ startTime, endTime, available: !isBlocked && !isBooked });
  }

  return slots;
}

export async function getAvailableSlots(
  specialistId: string,
  dateStr: string
): Promise<TimeSlot[]> {
  const result = await getAvailableSlotsWithMeta(specialistId, dateStr);
  return result.slots;
}

export async function getAvailableSlotsWithMeta(
  specialistId: string,
  dateStr: string
): Promise<SlotsResult> {
  const key = `${specialistId}:${dateStr}`;
  const distributedKey = `slots:${key}`;
  const now = Date.now();
  const cached = slotsCache.get(key);

  if (cached && cached.expiresAt > now) {
    return { slots: cached.slots, cacheHit: true };
  }

  const inFlight = slotsInFlight.get(key);
  if (inFlight) {
    return inFlight;
  }

  for (const [cacheKey, entry] of slotsCache.entries()) {
    if (entry.expiresAt <= now) {
      slotsCache.delete(cacheKey);
    }
  }

  if (slotsCache.size > SLOTS_CACHE_MAX_KEYS) {
    const oldestEntries = [...slotsCache.entries()]
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt)
      .slice(0, slotsCache.size - SLOTS_CACHE_MAX_KEYS);

    for (const [cacheKey] of oldestEntries) {
      slotsCache.delete(cacheKey);
    }
  }

  const pending = (async () => {
    const distributedResult = await withDistributedSecurityState(distributedKey, "slots-cache", async ({ entry, tx }) => {
      const currentNow = Date.now();

      if (entry && entry.expiresAt.getTime() > currentNow) {
        const parsed = JSON.parse(entry.value) as { slots?: TimeSlot[] };
        const sharedSlots = Array.isArray(parsed.slots) ? parsed.slots : [];
        slotsCache.set(key, { slots: sharedSlots, expiresAt: entry.expiresAt.getTime() });
        return { slots: sharedSlots, cacheHit: true };
      }

      const slots = await getAvailableSlotsFromDb(prisma, specialistId, dateStr);
      const expiresAt = new Date(currentNow + SLOTS_CACHE_TTL_MS);
      await tx.securityState.upsert({
        where: { key: distributedKey },
        create: {
          key: distributedKey,
          kind: "slots-cache",
          value: JSON.stringify({ slots }),
          expiresAt,
        },
        update: {
          kind: "slots-cache",
          value: JSON.stringify({ slots }),
          expiresAt,
        },
      });

      slotsCache.set(key, { slots, expiresAt: expiresAt.getTime() });
      return { slots, cacheHit: false };
    });

    if (distributedResult) {
      return distributedResult;
    }

    const slots = await getAvailableSlotsFromDb(prisma, specialistId, dateStr);
    slotsCache.set(key, { slots, expiresAt: Date.now() + SLOTS_CACHE_TTL_MS });
    return { slots, cacheHit: false };
  })();

  slotsInFlight.set(key, pending);

  try {
    return await pending;
  } finally {
    slotsInFlight.delete(key);
  }
}

export async function checkSlotAvailabilityWithDb(
  db: SlotDb,
  specialistId: string,
  dateStr: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const slots = await getAvailableSlotsFromDb(db, specialistId, dateStr);
  return slots.some(
    (slot) => slot.startTime === startTime && slot.endTime === endTime && slot.available
  );
}

export async function checkSlotAvailability(
  specialistId: string,
  dateStr: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  return checkSlotAvailabilityWithDb(prisma, specialistId, dateStr, startTime, endTime);
}
