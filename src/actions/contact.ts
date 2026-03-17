"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const contactSchema = z.object({
  name: z.string().min(2, "Ad soyad gerekli"),
  phone: z.string().min(10, "Geçerli telefon girin").regex(/^[\d\s\+\-\(\)]+$/),
  email: z.string().email("Geçerli e-posta girin").or(z.literal("")),
  subject: z.string().min(3, "Konu gerekli"),
  message: z.string().min(10, "Mesaj gerekli"),
});

export async function submitContactAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  await prisma.contactRequest.create({ data: parsed.data });
  return { success: true };
}

export async function markContactReadAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID gerekli" };
  await prisma.contactRequest.update({ where: { id }, data: { isRead: true } });
  revalidatePath("/admin/contact-requests");
  return { success: true };
}

export async function deleteContactRequestAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return { success: false, error: "ID gerekli" };
  await prisma.contactRequest.delete({ where: { id } });
  revalidatePath("/admin/contact-requests");
  return { success: true };
}
