"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { recordIdSchema, sanitizeEmailInput, sanitizePhoneInput, sanitizeTextInput, sanitizeTextareaInput } from "@/lib/input";
import { verifyTurnstileToken } from "@/lib/bot-protection";
import { enforceRateLimit, validateFormAge, validateHoneypot } from "@/lib/security";
import { logEvent } from "@/lib/observability";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad gerekli").max(120).transform(sanitizeTextInput),
  phone: z.string().trim().min(10, "Geçerli telefon girin").max(30).regex(/^[\d\s\+\-\(\)]+$/).transform(sanitizePhoneInput),
  email: z.string().trim().email("Geçerli e-posta girin").transform(sanitizeEmailInput).or(z.literal("")),
  subject: z.string().trim().min(3, "Konu gerekli").max(160).transform(sanitizeTextInput),
  message: z.string().trim().min(10, "Mesaj gerekli").max(2000).transform(sanitizeTextareaInput),
});

const contactRequestIdSchema = z.object({
  id: recordIdSchema,
});

export async function submitContactAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!validateHoneypot(formData) || !validateFormAge(formData)) {
    return { success: false, error: "İstek doğrulanamadı. Lütfen tekrar deneyin." };
  }

  const turnstileValid = await verifyTurnstileToken(formData.get("cf-turnstile-response"));
  if (!turnstileValid) {
    return { success: false, error: "Bot doğrulaması başarısız oldu. Lütfen tekrar deneyin." };
  }

  const allowed = await enforceRateLimit({
    scope: "contact-submit",
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!allowed) {
    return { success: false, error: "Çok fazla mesaj gönderildi. Lütfen biraz sonra tekrar deneyin." };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  const createdRequest = await prisma.contactRequest.create({ data: parsed.data });

  logEvent({
    event: "contact_request_created",
    route: "action:submitContact",
    meta: {
      contactRequestId: createdRequest.id,
      subjectLength: parsed.data.subject.length,
      hasEmail: Boolean(parsed.data.email),
      messageLength: parsed.data.message.length,
    },
  });

  revalidatePath("/admin/contact-requests");
  return { success: true };
}

export async function markContactReadAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = contactRequestIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "ID gerekli" };

  await prisma.contactRequest.update({ where: { id: parsed.data.id }, data: { isRead: true } });

  logEvent({
    event: "contact_request_marked_read",
    route: "action:markContactRead",
    meta: { contactRequestId: parsed.data.id },
  });

  revalidatePath("/admin/contact-requests");
  return { success: true };
}

export async function deleteContactRequestAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = contactRequestIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "ID gerekli" };

  await prisma.contactRequest.delete({ where: { id: parsed.data.id } });

  logEvent({
    event: "contact_request_deleted",
    route: "action:deleteContactRequest",
    meta: { contactRequestId: parsed.data.id },
  });

  revalidatePath("/admin/contact-requests");
  return { success: true };
}
