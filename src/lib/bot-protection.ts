import { getOptionalEnv } from "@/lib/env";

export function isTurnstileEnabled() {
  const env = getOptionalEnv();
  return Boolean(env.TURNSTILE_SECRET_KEY && env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
}

export function getTurnstileSiteKey() {
  return getOptionalEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
}

export async function verifyTurnstileToken(token: FormDataEntryValue | null): Promise<boolean> {
  const env = getOptionalEnv();
  const isProduction = env.NODE_ENV === "production";

  if (!env.TURNSTILE_SECRET_KEY || !env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
    return !isProduction;
  }

  if (typeof token !== "string" || token.trim().length === 0) {
    return false;
  }

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  });

  let response: Response;

  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return false;
  }

  if (!response.ok) {
    return false;
  }

  const result = (await response.json()) as { success?: boolean; hostname?: string };
  if (result.success !== true) {
    return false;
  }

  const allowedHosts = [
    env.NEXT_PUBLIC_APP_URL,
    env.NEXT_PUBLIC_SITE_URL,
    env.NEXTAUTH_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL,
  ]
    .filter(Boolean)
    .flatMap((value) => {
      try {
        const url = value?.startsWith("http://") || value?.startsWith("https://") ? value : `https://${value}`;
        return [new URL(url).hostname.toLowerCase()];
      } catch {
        return [];
      }
    });

  if (result.hostname && allowedHosts.length > 0 && !allowedHosts.includes(result.hostname.toLowerCase())) {
    return false;
  }

  return true;
}
