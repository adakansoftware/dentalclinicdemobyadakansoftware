import { buildActionReplayKey, claimActionReplayAsync } from "@/lib/action-replay";
import { verifyTurnstileToken } from "@/lib/bot-protection";
import { getSuspicionDecisionAsync, recordSuspiciousActivityAsync } from "@/lib/attack-monitor";
import { enforceRateLimit, enforceRateLimitByKeyAsync, getClientIpRateLimitKey, validateFormAge, validateHoneypot } from "@/lib/security";
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
  replayProtection?: {
    scope: string;
    ttlMs: number;
    values: Array<string | number | boolean | null | undefined>;
    duplicateErrorMessage?: string;
  };
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
    replayProtection,
    validationErrorMessage = "Istek dogrulanamadi. Lutfen tekrar deneyin.",
    turnstileErrorMessage = "Bot dogrulamasi basarisiz oldu. Lutfen tekrar deneyin.",
    rateLimitErrorMessage = "Cok fazla deneme yapildi. Lutfen biraz sonra tekrar deneyin.",
  } = options;

  const clientIpKey = await getClientIpRateLimitKey();
  const suspicionDecision = await getSuspicionDecisionAsync(clientIpKey);
  if (suspicionDecision.blocked) {
    return {
      success: false,
      error: "Supheli istek trafigi gecici olarak engellendi. Lutfen daha sonra tekrar deneyin.",
    };
  }

  if (!validateHoneypot(formData) || !validateFormAge(formData)) {
    await recordSuspiciousActivityAsync(clientIpKey, 2);
    return { success: false, error: validationErrorMessage };
  }

  const turnstileValid = await verifyTurnstileToken(formData.get("cf-turnstile-response"));
  if (!turnstileValid) {
    await recordSuspiciousActivityAsync(clientIpKey, 3);
    return { success: false, error: turnstileErrorMessage };
  }

  if (replayProtection) {
    const replayKey = buildActionReplayKey(replayProtection.scope, [clientIpKey, ...replayProtection.values]);
    const replayClaim = await claimActionReplayAsync(replayKey, replayProtection.ttlMs);
    if (replayClaim.duplicate) {
      await recordSuspiciousActivityAsync(clientIpKey, 1);
      return {
        success: false,
        error: replayProtection.duplicateErrorMessage ?? "Bu istek zaten alindi. Lutfen tekrar denemeden once bekleyin.",
      };
    }
  }

  if (!rateLimit) {
    return null;
  }

  const allowed = await enforceRateLimit(rateLimit);
  if (!allowed) {
    await recordSuspiciousActivityAsync(clientIpKey, 1);
    return { success: false, error: rateLimitErrorMessage };
  }

  const ipAllowed = await enforceRateLimitByKeyAsync(
    {
      scope: `${rateLimit.scope}-ip`,
      limit: Math.max(rateLimit.limit * 2, rateLimit.limit + 3),
      windowMs: rateLimit.windowMs,
      keySuffix: "ip-only",
    },
    clientIpKey
  );

  if (!ipAllowed) {
    await recordSuspiciousActivityAsync(clientIpKey, 2);
    return { success: false, error: rateLimitErrorMessage };
  }

  return null;
}
