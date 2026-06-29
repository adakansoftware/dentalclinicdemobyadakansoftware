import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { cache } from "react";

const SESSION_COOKIE = "admin_session";
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
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

const getAdminFromSessionCached = cache(async () => {
  const token = await getSessionToken();
  if (!token) return null;

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
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}
