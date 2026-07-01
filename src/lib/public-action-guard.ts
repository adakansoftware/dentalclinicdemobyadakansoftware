import { verifyTurnstileToken } from "@/lib/bot-protection";
import { getSuspicionDecision, recordSuspiciousActivity } from "@/lib/attack-monitor";
import { enforceRateLimit, enforceRateLimitByKey, getClientIpRateLimitKey, validateFormAge, validateHoneypot } from "@/lib/security";
import type { ActionResult } from "@/types";

type PublicRateLimitOptions = {
  scope: string;
  limit: number;
  windowMs: number;
  keySuffix?: string;
};

type PublicActionGuardOptions = {
  formData: FormData;
  rateLimit?: PublicRateLimitOptions;
  validationErrorMessage?: string;
  turnstileErrorMessage?: string;
  rateLimitErrorMessage?: string;
};

export async function runPublicActionGuard<T = unknown>(
  options: PublicActionGuardOptions
): Promise<ActionResult<T> | null> {
  const {
    formData,
    rateLimit,
    validationErrorMessage = "Istek dogrulanamadi. Lutfen tekrar deneyin.",
    turnstileErrorMessage = "Bot dogrulamasi basarisiz oldu. Lutfen tekrar deneyin.",
    rateLimitErrorMessage = "Cok fazla deneme yapildi. Lutfen biraz sonra tekrar deneyin.",
  } = options;

  const clientIpKey = await getClientIpRateLimitKey();
  const suspicionDecision = getSuspicionDecision(clientIpKey);
  if (suspicionDecision.blocked) {
    return {
      success: false,
      error: "Supheli istek trafigi gecici olarak engellendi. Lutfen daha sonra tekrar deneyin.",
    };
  }

  if (!validateHoneypot(formData) || !validateFormAge(formData)) {
    recordSuspiciousActivity(clientIpKey, 2);
    return { success: false, error: validationErrorMessage };
  }

  const turnstileValid = await verifyTurnstileToken(formData.get("cf-turnstile-response"));
  if (!turnstileValid) {
    recordSuspiciousActivity(clientIpKey, 3);
    return { success: false, error: turnstileErrorMessage };
  }

  if (!rateLimit) {
    return null;
  }

  const allowed = await enforceRateLimit(rateLimit);
  if (!allowed) {
    recordSuspiciousActivity(clientIpKey, 1);
    return { success: false, error: rateLimitErrorMessage };
  }

  const ipAllowed = enforceRateLimitByKey(
    {
      scope: `${rateLimit.scope}-ip`,
      limit: Math.max(rateLimit.limit * 2, rateLimit.limit + 3),
      windowMs: rateLimit.windowMs,
      keySuffix: "ip-only",
    },
    clientIpKey
  );

  if (!ipAllowed) {
    recordSuspiciousActivity(clientIpKey, 2);
    return { success: false, error: rateLimitErrorMessage };
  }

  return null;
}
