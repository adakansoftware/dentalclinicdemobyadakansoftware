"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { sanitizeEmailInput } from "@/lib/input";
import { verifyTurnstileToken } from "@/lib/bot-protection";
import { enforceRateLimit, getRequestFingerprint, validateFormAge, validateHoneypot } from "@/lib/security";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types";

const loginSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta girin").transform(sanitizeEmailInput),
  password: z.string().min(1, "Şifre gereklidir"),
});

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!validateHoneypot(formData) || !validateFormAge(formData)) {
    return { success: false, error: "İstek doğrulanamadı. Lütfen tekrar deneyin." };
  }

  const turnstileValid = await verifyTurnstileToken(formData.get("cf-turnstile-response"));
  if (!turnstileValid) {
    return { success: false, error: "Bot doğrulaması başarısız oldu. Lütfen tekrar deneyin." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  const loginKey = `${parsed.data.email}:${await getRequestFingerprint()}`;
  const allowed = await enforceRateLimit({
    scope: "admin-login",
    limit: 5,
    windowMs: 15 * 60 * 1000,
    keySuffix: loginKey,
  });

  if (!allowed) {
    return { success: false, error: "Çok fazla giriş denemesi yapıldı. Lütfen biraz sonra tekrar deneyin." };
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
  });

  if (!admin) {
    return { success: false, error: "E-posta veya şifre hatalı" };
  }

  const valid = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!valid) {
    return { success: false, error: "E-posta veya şifre hatalı" };
  }

  const token = await createSession(admin.id);
  await setSessionCookie(token);

  redirect("/admin");
}

export async function logoutAction(): Promise<ActionResult> {
  await destroySession();
  redirect("/admin/login");
}
