"use server";

import { z } from "zod";
import { runAdminMutation } from "@/lib/admin-mutation";
import { isBackendError } from "@/lib/backend-errors";
import {
  createContactRequestRecord,
  deleteContactRequestRecord,
  markContactRequestReadRecord,
} from "@/lib/contact-service";
import { recordIdSchema, sanitizeEmailInput, sanitizePhoneInput, sanitizeTextInput, sanitizeTextareaInput } from "@/lib/input";
import { logEvent } from "@/lib/observability";
import { runPublicActionGuard } from "@/lib/public-action-guard";
import type { ActionResult } from "@/types";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad gerekli").max(120).transform(sanitizeTextInput),
  phone: z.string().trim().min(10, "Gecerli telefon girin").max(30).regex(/^[\d\s\+\-\(\)]+$/).transform(sanitizePhoneInput),
  email: z.string().trim().email("Gecerli e-posta girin").transform(sanitizeEmailInput).or(z.literal("")),
  subject: z.string().trim().min(3, "Konu gerekli").max(160).transform(sanitizeTextInput),
  message: z.string().trim().min(10, "Mesaj gerekli").max(2000).transform(sanitizeTextareaInput),
});

const contactRequestIdSchema = z.object({
  id: recordIdSchema,
});

export async function submitContactAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const guardResult = await runPublicActionGuard({
    formData,
    rateLimit: {
      scope: "contact-submit",
      limit: 5,
      windowMs: 15 * 60 * 1000,
      keySuffix: [String(formData.get("phone") ?? ""), String(formData.get("email") ?? "")].join(":"),
    },
    rateLimitErrorMessage: "Cok fazla mesaj gonderildi. Lutfen biraz sonra tekrar deneyin.",
  });

  if (guardResult) {
    return guardResult;
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

  const createdRequest = await createContactRequestRecord(parsed.data);

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

  return { success: true };
}

export async function markContactReadAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = contactRequestIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "ID gerekli" };
  }

  return runAdminMutation({
    route: "action:markContactRead",
    event: "contact_request_marked_read",
    execute: async () => {
      const updatedRequest = await markContactRequestReadRecord(parsed.data.id);
      return {
        meta: {
          contactRequestId: updatedRequest.id,
          alreadyRead: updatedRequest.isRead,
        },
        revalidate: ["/admin/contact-requests"],
      };
    },
    getErrorMessage: (error) =>
      isBackendError(error, "CONTACT_REQUEST_NOT_FOUND") ? "Iletisim talebi bulunamadi" : "Iletisim talebi guncellenemedi",
  });
}

export async function deleteContactRequestAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = contactRequestIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "ID gerekli" };
  }

  return runAdminMutation({
    route: "action:deleteContactRequest",
    event: "contact_request_deleted",
    execute: async () => {
      const deletedRequest = await deleteContactRequestRecord(parsed.data.id);
      return {
        meta: {
          contactRequestId: deletedRequest.id,
          wasRead: deletedRequest.isRead,
        },
        revalidate: ["/admin/contact-requests"],
      };
    },
    getErrorMessage: (error) =>
      isBackendError(error, "CONTACT_REQUEST_NOT_FOUND") ? "Iletisim talebi bulunamadi" : "Iletisim talebi silinemedi",
  });
}
