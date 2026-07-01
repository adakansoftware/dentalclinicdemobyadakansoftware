"use server";

import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { sanitizeEmailInput } from "@/lib/input";
import { logEvent } from "@/lib/observability";
import { runPublicActionGuard } from "@/lib/public-action-guard";
import { getRequestFingerprint } from "@/lib/security";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/types";

const loginSchema = z.object({
  email: z.string().trim().email("Gecerli bir e-posta girin").transform(sanitizeEmailInput),
  password: z.string().min(1, "Sifre gereklidir"),
});

function fingerprintIdentifier(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Hata" };
  }

  const fingerprint = await getRequestFingerprint();
  const loginKey = `${parsed.data.email}:${fingerprint}`;
  const emailHash = fingerprintIdentifier(parsed.data.email);
  const guardResult = await runPublicActionGuard({
    formData,
    rateLimit: {
      scope: "admin-login",
      limit: 5,
      windowMs: 15 * 60 * 1000,
      keySuffix: loginKey,
    },
    rateLimitErrorMessage: "Cok fazla giris denemesi yapildi. Lutfen biraz sonra tekrar deneyin.",
  });
  if (guardResult) {
    logEvent({
      level: "warn",
      event: "admin_login_rate_limited",
      route: "action:login",
      meta: {
        emailHash,
        fingerprint,
      },
    });

    return guardResult;
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
  });

  if (!admin) {
    logEvent({
      level: "warn",
      event: "admin_login_failed",
      route: "action:login",
      meta: {
        reason: "admin_not_found",
        emailHash,
        fingerprint,
      },
    });

    return { success: false, error: "E-posta veya sifre hatali" };
  }

  const valid = await verifyPassword(parsed.data.password, admin.passwordHash);
  if (!valid) {
    logEvent({
      level: "warn",
      event: "admin_login_failed",
      route: "action:login",
      meta: {
        reason: "invalid_password",
        adminId: admin.id,
        emailHash,
        fingerprint,
      },
    });

    return { success: false, error: "E-posta veya sifre hatali" };
  }

  const token = await createSession(admin.id);
  await setSessionCookie(token);

  logEvent({
    event: "admin_login_succeeded",
    route: "action:login",
    meta: {
      adminId: admin.id,
      adminName: admin.name,
      emailHash,
      fingerprint,
    },
  });

  redirect("/admin");
}

export async function logoutAction(): Promise<ActionResult> {
  logEvent({
    event: "admin_logout_started",
    route: "action:logout",
  });

  await destroySession();
  redirect("/admin/login");
}
