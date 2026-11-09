import { z } from "zod";
import { sanitizeEmailInput, sanitizePhoneInput, sanitizeTextInput, sanitizeTextareaInput } from "@/lib/input";

// Server action zod schemas live here (not in the "use server" files) because
// a "use server" module may only export async functions — exporting a schema
// from there breaks the Next.js build. The actions import these schemas and
// tests exercise them directly without touching the action modules.

export const createAppointmentSchema = z
  .object({
    serviceId: z.string().min(1, "Hizmet secimi gerekli"),
    specialistId: z.string().min(1, "Uzman secimi gerekli"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Gecerli tarih girin"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Gecerli saat girin"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Gecerli bitis saati girin"),
    patientName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmali").max(120),
    patientPhone: z.string().trim().min(10, "Gecerli telefon numarasi girin").max(30).regex(/^[\d\s\+\-\(\)]+$/),
    patientEmail: z.string().trim().email().or(z.literal("")),
    patientNote: z.string().trim().max(500).optional(),
    patientLanguage: z.enum(["TR", "EN"]).default("TR"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "Bitis saati baslangic saatinden sonra olmali",
    path: ["endTime"],
  });

export const cancelAppointmentSchema = z.object({
  patientName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmali").max(120),
  patientPhone: z.string().trim().min(10, "Gecerli telefon numarasi girin").max(30).regex(/^[\d\s\+\-\(\)]+$/),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Gecerli tarih girin"),
  patientLanguage: z.enum(["TR", "EN"]).default("TR"),
});

export const lookupAppointmentsSchema = z.object({
  patientName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmali").max(120),
  patientPhone: z.string().trim().min(10, "Gecerli telefon numarasi girin").max(30).regex(/^[\d\s\+\-\(\)]+$/),
  patientLanguage: z.enum(["TR", "EN"]).default("TR"),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad gerekli").max(120).transform(sanitizeTextInput),
  phone: z.string().trim().min(10, "Gecerli telefon girin").max(30).regex(/^[\d\s\+\-\(\)]+$/).transform(sanitizePhoneInput),
  email: z.string().trim().email("Gecerli e-posta girin").transform(sanitizeEmailInput).or(z.literal("")),
  subject: z.string().trim().min(3, "Konu gerekli").max(160).transform(sanitizeTextInput),
  message: z.string().trim().min(10, "Mesaj gerekli").max(2000).transform(sanitizeTextareaInput),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Gecerli bir e-posta girin").transform(sanitizeEmailInput),
  password: z.string().min(1, "Sifre gereklidir"),
});
