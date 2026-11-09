"use server";

import { z } from "zod";
import { runAdminMutation } from "@/lib/admin-mutation";
import { contactSchema } from "@/lib/action-schemas";
import { isBackendError } from "@/lib/backend-errors";
import {
  createContactRequestRecord,
  deleteContactRequestRecord,
  markContactRequestReadRecord,
} from "@/lib/contact-service";
import { recordIdSchema } from "@/lib/input";
import { logEvent } from "@/lib/observability";
import { runPublicActionGuard } from "@/lib/public-action-guard";
import type { ActionResult } from "@/types";

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
    replayProtection: {
      scope: "contact-submit",
      ttlMs: 30_000,
      values: [
        String(formData.get("phone") ?? ""),
        String(formData.get("email") ?? ""),
        String(formData.get("subject") ?? ""),
      ],
      duplicateErrorMessage: "Bu mesaj istegi zaten alindi. Lutfen tekrar gondermeden once bekleyin.",
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
