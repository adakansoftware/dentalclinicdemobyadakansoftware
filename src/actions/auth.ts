"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie, destroySession, verifyPassword } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre gereklidir"),
});

export async function loginAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
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
