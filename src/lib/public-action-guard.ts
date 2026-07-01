import { verifyTurnstileToken } from "@/lib/bot-protection";
import { enforceRateLimit, validateFormAge, validateHoneypot } from "@/lib/security";
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

  if (!validateHoneypot(formData) || !validateFormAge(formData)) {
    return { success: false, error: validationErrorMessage };
  }

  const turnstileValid = await verifyTurnstileToken(formData.get("cf-turnstile-response"));
  if (!turnstileValid) {
    return { success: false, error: turnstileErrorMessage };
  }

  if (!rateLimit) {
    return null;
  }

  const allowed = await enforceRateLimit(rateLimit);
  if (!allowed) {
    return { success: false, error: rateLimitErrorMessage };
  }

  return null;
}
