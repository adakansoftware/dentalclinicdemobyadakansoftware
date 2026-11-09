import { describe, expect, test } from "vitest";
import {
  cancelAppointmentSchema,
  contactSchema,
  createAppointmentSchema,
  loginSchema,
  lookupAppointmentsSchema,
} from "@/lib/action-schemas";

const validAppointment = {
  serviceId: "svc-1",
  specialistId: "sp-1",
  date: "2026-12-01",
  startTime: "09:00",
  endTime: "09:30",
  patientName: "Ad Soyad",
  patientPhone: "05551234567",
  patientEmail: "",
  patientNote: "",
  patientLanguage: "TR",
};

describe("createAppointmentSchema", () => {
  test("accepts a valid appointment", () => {
    const parsed = createAppointmentSchema.safeParse(validAppointment);
    expect(parsed.success).toBe(true);
  });

  test("defaults patientLanguage to TR when omitted", () => {
    const { patientLanguage: _dropped, ...withoutLanguage } = validAppointment;
    const parsed = createAppointmentSchema.safeParse(withoutLanguage);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.patientLanguage).toBe("TR");
    }
  });

  test("rejects endTime before startTime", () => {
    const parsed = createAppointmentSchema.safeParse({
      ...validAppointment,
      startTime: "10:00",
      endTime: "09:00",
    });
    expect(parsed.success).toBe(false);
  });

  test("rejects malformed date", () => {
    const parsed = createAppointmentSchema.safeParse({
      ...validAppointment,
      date: "07-04-2026",
    });
    expect(parsed.success).toBe(false);
  });

  test("rejects short and non-numeric phones", () => {
    expect(
      createAppointmentSchema.safeParse({ ...validAppointment, patientPhone: "123" }).success
    ).toBe(false);
    expect(
      createAppointmentSchema.safeParse({ ...validAppointment, patientPhone: "drop table users" }).success
    ).toBe(false);
  });

  test("rejects invalid email but allows empty", () => {
    expect(
      createAppointmentSchema.safeParse({ ...validAppointment, patientEmail: "not-an-email" }).success
    ).toBe(false);
    expect(
      createAppointmentSchema.safeParse({ ...validAppointment, patientEmail: "" }).success
    ).toBe(true);
  });

  test("rejects names shorter than 2 chars", () => {
    expect(createAppointmentSchema.safeParse({ ...validAppointment, patientName: "A" }).success).toBe(false);
  });

  test("rejects unsupported language codes", () => {
    expect(
      createAppointmentSchema.safeParse({ ...validAppointment, patientLanguage: "DE" }).success
    ).toBe(false);
  });
});

describe("cancelAppointmentSchema", () => {
  test("accepts valid cancellation data", () => {
    const parsed = cancelAppointmentSchema.safeParse({
      patientName: "Ad Soyad",
      patientPhone: "05551234567",
      date: "2026-12-01",
    });
    expect(parsed.success).toBe(true);
  });

  test("rejects malformed date", () => {
    expect(
      cancelAppointmentSchema.safeParse({
        patientName: "Ad Soyad",
        patientPhone: "05551234567",
        date: "01/12/2026",
      }).success
    ).toBe(false);
  });
});

describe("lookupAppointmentsSchema", () => {
  test("accepts valid lookup data", () => {
    const parsed = lookupAppointmentsSchema.safeParse({
      patientName: "Ad Soyad",
      patientPhone: "05551234567",
    });
    expect(parsed.success).toBe(true);
  });

  test("rejects missing name", () => {
    expect(
      lookupAppointmentsSchema.safeParse({ patientPhone: "05551234567" }).success
    ).toBe(false);
  });
});

describe("contactSchema", () => {
  const validContact = {
    name: "Ad Soyad",
    phone: "05551234567",
    email: "",
    subject: "Randevu talebi",
    message: "Merhaba, randevu almak istiyorum.",
  };

  test("accepts valid contact message", () => {
    expect(contactSchema.safeParse(validContact).success).toBe(true);
  });

  test("rejects short subject", () => {
    expect(contactSchema.safeParse({ ...validContact, subject: "ab" }).success).toBe(false);
  });

  test("rejects short message", () => {
    expect(contactSchema.safeParse({ ...validContact, message: "kisa" }).success).toBe(false);
  });

  test("rejects invalid email but allows empty", () => {
    expect(contactSchema.safeParse({ ...validContact, email: "bad-email" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...validContact, email: "" }).success).toBe(true);
  });
});

describe("loginSchema", () => {
  test("accepts valid credentials shape", () => {
    expect(
      loginSchema.safeParse({ email: "admin@example.com", password: "secret123" }).success
    ).toBe(true);
  });

  test("rejects non-email usernames", () => {
    expect(loginSchema.safeParse({ email: "admin", password: "secret123" }).success).toBe(false);
  });

  test("rejects empty password", () => {
    expect(loginSchema.safeParse({ email: "admin@example.com", password: "" }).success).toBe(false);
  });
});
