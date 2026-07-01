import { cookies, headers } from "next/headers";
import { createAdminStepUpProof, getAdminStepUpTtlSec, verifyAdminStepUpProof } from "@/lib/admin-step-up";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { logEvent } from "@/lib/observability";
import {
  buildAdminSessionClientBinding,
  hashAdminSessionGuard,
  shouldInvalidateAdminSessionGuard,
  shouldRotateAdminSession,
} from "@/lib/session-guard";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { cache } from "react";

const SESSION_COOKIE = "admin_session";
const SESSION_GUARD_COOKIE = "admin_session_guard";
const ADMIN_STEP_UP_COOKIE = "admin_step_up";
const SESSION_DURATION_DAYS = 7;

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(adminId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.adminSession.create({
    data: { token: hashSessionToken(token), adminId, expiresAt },
  });

  return token;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const clientBinding = buildAdminSessionClientBinding(headerStore);
  const sessionGuard = hashAdminSessionGuard(token, clientBinding);
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
  cookieStore.set(SESSION_GUARD_COOKIE, sessionGuard, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
}

async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(SESSION_GUARD_COOKIE);
  cookieStore.delete(ADMIN_STEP_UP_COOKIE);
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getSessionGuardToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_GUARD_COOKIE)?.value ?? null;
}

export async function hasRecentAdminStepUp(adminId: string): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminStepUpProof(adminId, cookieStore.get(ADMIN_STEP_UP_COOKIE)?.value ?? null);
}

export async function grantRecentAdminStepUp(adminId: string) {
  const cookieStore = await cookies();
  const value = createAdminStepUpProof(adminId, Math.floor(Date.now() / 1000));

  cookieStore.set(ADMIN_STEP_UP_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: getAdminStepUpTtlSec(),
  });
}

const getAdminFromSessionCached = cache(async () => {
  const token = await getSessionToken();
  if (!token) return null;
  const sessionGuard = await getSessionGuardToken();
  const headerStore = await headers();
  const clientBinding = buildAdminSessionClientBinding(headerStore);

  const hashedToken = hashSessionToken(token);
  const session = await safeQuery(
    "admin session lookup",
    () =>
      prisma.adminSession.findFirst({
        where: {
          OR: [{ token: hashedToken }, { token }],
        },
        include: { admin: true },
      }),
    null,
    { timeoutMs: 3000, shouldLog: false }
  );

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await safeQuery("delete expired admin session", () => prisma.adminSession.delete({ where: { id: session.id } }), null, {
        shouldLog: false,
      });
    }
    return null;
  }

  if (shouldInvalidateAdminSessionGuard(token, clientBinding, sessionGuard)) {
    await clearSessionCookies();
    logEvent({
      level: "warn",
      event: "admin_session_guard_rejected",
      route: "lib:auth",
      meta: {
        adminId: session.adminId,
      },
    });
    return null;
  }

  if (session.token === token) {
    await safeQuery(
      "upgrade legacy admin session token",
      () =>
        prisma.adminSession.update({
          where: { id: session.id },
          data: { token: hashedToken },
        }),
      null
    );
  }

  if (shouldRotateAdminSession(session.createdAt)) {
    const rotatedToken = randomBytes(32).toString("hex");
    await safeQuery(
      "rotate admin session token",
      () =>
        prisma.adminSession.update({
          where: { id: session.id },
          data: {
            token: hashSessionToken(rotatedToken),
            createdAt: new Date(),
          },
        }),
      null,
      { shouldLog: false }
    );
    await setSessionCookie(rotatedToken);
  }

  return session.admin;
});

export async function getAdminFromSession() {
  return getAdminFromSessionCached();
}

export async function requireAdmin() {
  const admin = await getAdminFromSession();
  if (!admin) {
    redirect("/admin/login");
  }
  return admin;
}

export async function destroySession() {
  const token = await getSessionToken();
  if (token) {
    const hashedToken = hashSessionToken(token);
    await safeQuery(
      "destroy admin session",
      () =>
        prisma.adminSession.deleteMany({
          where: {
            OR: [{ token }, { token: hashedToken }],
          },
        }),
      null,
      { shouldLog: false }
    );
  }
  await clearSessionCookies();
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function verifyStepUpPassword(plain: string | undefined, hash: string): Promise<boolean> {
  if (!plain) {
    return false;
  }

  return verifyPassword(plain, hash);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}
