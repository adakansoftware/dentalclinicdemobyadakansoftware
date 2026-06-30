import { prisma } from "@/lib/prisma";
import { hasConflictingActiveAppointment } from "@/lib/appointment-conflicts";
import { canTransitionAppointmentStatus } from "@/lib/appointment-state";
import { checkSlotAvailabilityWithDb } from "@/lib/slots";
import { compareDateStrings, dateOnlyToDbDate, dateToIsoDate, getUtcRangeForTurkeyDate } from "@/lib/date";
import { BackendError } from "@/lib/backend-errors";
import type { PublicAppointmentLookupItem } from "@/types";

function normalizePhoneForComparison(phone: string) {
  return phone.replace(/\D/g, "");
}

function normalizeNameForComparison(name: string) {
  return name
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function getAppointmentIdsByNormalizedPhone(params: {
  normalizedPhone: string;
  startUtc: Date;
  endUtc?: Date;
  activeOnly?: boolean;
  limit: number;
}) {
  const rows =
    params.activeOnly && params.endUtc
      ? await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT id
          FROM "Appointment"
          WHERE "date" >= ${params.startUtc}
            AND "date" <= ${params.endUtc}
            AND "status" IN ('PENDING', 'CONFIRMED')
            AND regexp_replace("patientPhone", '\D', '', 'g') = ${params.normalizedPhone}
          ORDER BY "date" ASC, "startTime" ASC
          LIMIT ${params.limit}
        `
      : await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT id
          FROM "Appointment"
          WHERE "date" >= ${params.startUtc}
            AND regexp_replace("patientPhone", '\D', '', 'g') = ${params.normalizedPhone}
          ORDER BY "date" ASC, "startTime" ASC
          LIMIT ${params.limit}
        `;

  return rows.map((row) => row.id);
}

export interface CreateAppointmentRecordInput {
  serviceId: string;
  specialistId: string;
  date: string;
  startTime: string;
  endTime: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientNote: string;
  patientLanguage: "TR" | "EN";
}

export async function createAppointmentRecord(input: CreateAppointmentRecordInput) {
  return prisma.$transaction(async (tx) => {
    const lockKey = `appointment:${input.specialistId}:${input.date}:${input.startTime}:${input.endTime}`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

    const available = await checkSlotAvailabilityWithDb(tx, input.specialistId, input.date, input.startTime, input.endTime);
    if (!available) {
      throw new BackendError("SLOT_UNAVAILABLE", "Requested slot is no longer available", {
        specialistId: input.specialistId,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
      });
    }

    return tx.appointment.create({
      data: {
        serviceId: input.serviceId,
        specialistId: input.specialistId,
        date: dateOnlyToDbDate(input.date),
        startTime: input.startTime,
        endTime: input.endTime,
        patientName: input.patientName,
        patientPhone: input.patientPhone,
        patientEmail: input.patientEmail,
        patientNote: input.patientNote,
        patientLanguage: input.patientLanguage,
        status: "PENDING",
      },
    });
  });
}

export interface UpdateAppointmentStatusRecordInput {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  adminNote?: string;
}

export async function updateAppointmentStatusRecord(input: UpdateAppointmentStatusRecordInput) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: input.id },
    include: { service: true, specialist: true },
  });

  if (!appointment) {
    throw new BackendError("APPOINTMENT_NOT_FOUND", "Appointment not found", { appointmentId: input.id });
  }

  if (!canTransitionAppointmentStatus(appointment.status, input.status)) {
    throw new BackendError("APPOINTMENT_STATUS_CONFLICT", "Unsupported appointment status transition", {
      appointmentId: input.id,
      previousStatus: appointment.status,
      nextStatus: input.status,
    });
  }

  const updatedAppointment = await prisma.$transaction(async (tx) => {
    if (input.status === "PENDING" || input.status === "CONFIRMED") {
      const date = dateToIsoDate(appointment.date);
      const lockKey = `appointment:${appointment.specialistId}:${date}:${appointment.startTime}:${appointment.endTime}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

      const hasConflict = await hasConflictingActiveAppointment(tx, {
        specialistId: appointment.specialistId,
        date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        excludeAppointmentId: appointment.id,
      });

      if (hasConflict) {
        throw new BackendError("APPOINTMENT_STATUS_CONFLICT", "Another active appointment already occupies this slot", {
          appointmentId: input.id,
          specialistId: appointment.specialistId,
          date,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
        });
      }
    }

    return tx.appointment.update({
      where: { id: input.id },
      data: {
        status: input.status,
        adminNote: input.adminNote ?? appointment.adminNote,
      },
      include: { service: true, specialist: true },
    });
  });

  return { previousAppointment: appointment, updatedAppointment };
}

export interface CancelAppointmentByPhoneRecordInput {
  patientName: string;
  patientPhone: string;
  date: string;
}

export async function cancelAppointmentByPhoneRecord(input: CancelAppointmentByPhoneRecordInput) {
  const normalizedPhone = normalizePhoneForComparison(input.patientPhone);
  const normalizedName = normalizeNameForComparison(input.patientName);
  const { startUtc, endUtc } = getUtcRangeForTurkeyDate(input.date);

  const matchingIds = await getAppointmentIdsByNormalizedPhone({
    normalizedPhone,
    startUtc,
    endUtc,
    activeOnly: true,
    limit: 20,
  });

  const activeAppointments = matchingIds.length
    ? await prisma.appointment.findMany({
        where: {
          id: {
            in: matchingIds,
          },
        },
        orderBy: {
          startTime: "asc",
        },
      })
    : [];

  const matchingAppointments = activeAppointments.filter(
    (appointment) =>
      normalizePhoneForComparison(appointment.patientPhone) === normalizedPhone &&
      normalizeNameForComparison(appointment.patientName) === normalizedName
  );

  if (matchingAppointments.length > 1) {
    throw new BackendError("APPOINTMENT_CANCEL_CONFLICT", "Multiple matching appointments found", {
      date: input.date,
      normalizedPhone,
    });
  }

  const appointment = matchingAppointments[0] ?? null;
  if (!appointment) {
    return null;
  }

  return prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELLED" },
  });
}

export interface LookupAppointmentsByPhoneRecordInput {
  patientName: string;
  patientPhone: string;
  patientLanguage: "TR" | "EN";
  fromDate: string;
}

export async function lookupAppointmentsByPhoneRecord(
  input: LookupAppointmentsByPhoneRecordInput
): Promise<PublicAppointmentLookupItem[]> {
  const normalizedPhone = normalizePhoneForComparison(input.patientPhone);
  const normalizedName = normalizeNameForComparison(input.patientName);
  const { startUtc } = getUtcRangeForTurkeyDate(input.fromDate);

  const matchingIds = await getAppointmentIdsByNormalizedPhone({
    normalizedPhone,
    startUtc,
    limit: 50,
  });

  const appointments = matchingIds.length
    ? await prisma.appointment.findMany({
        where: {
          id: {
            in: matchingIds,
          },
        },
        include: {
          service: {
            select: {
              nameTr: true,
              nameEn: true,
            },
          },
          specialist: {
            select: {
              nameTr: true,
              nameEn: true,
            },
          },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      })
    : [];

  return appointments
    .filter(
      (appointment) =>
        normalizePhoneForComparison(appointment.patientPhone) === normalizedPhone &&
        normalizeNameForComparison(appointment.patientName) === normalizedName &&
        compareDateStrings(dateToIsoDate(appointment.date), input.fromDate) >= 0
    )
    .map((appointment) => ({
      id: appointment.id,
      date: dateToIsoDate(appointment.date),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      status: appointment.status,
      serviceName: input.patientLanguage === "EN" ? appointment.service.nameEn : appointment.service.nameTr,
      specialistName: input.patientLanguage === "EN" ? appointment.specialist.nameEn : appointment.specialist.nameTr,
    }));
}
