import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { grantRecentAdminStepUp, hasRecentAdminStepUp, requireAdmin, verifyStepUpPassword } from "@/lib/auth";
import { logAdminEvent } from "@/lib/admin-audit";
import { getSuspicionDecision, recordSuspiciousActivity } from "@/lib/attack-monitor";
import { logEvent } from "@/lib/observability";
import { isTrustedMutationOrigin } from "@/lib/request-origin";
import { ResilienceError, runWithCircuitBreaker, runWithConcurrencyLimit, runWithTimeout } from "@/lib/resilience";
import { buildIpRateLimitKeyFromHeaders, getRateLimitDecisionByKey } from "@/lib/security";
import type { ActionResult } from "@/types";

type RevalidateTarget =
  | string
  | {
      path: string;
      type?: "layout" | "page";
    };

interface AdminMutationResult<T = unknown> {
  data?: T;
  message?: string;
  meta?: Record<string, unknown>;
  revalidate?: RevalidateTarget[];
}

interface RunAdminMutationOptions<T = unknown> {
  route: string;
  event: string;
  execute: () => Promise<AdminMutationResult<T>>;
  getErrorMessage?: (error: unknown) => string;
  requireStepUp?: boolean;
  stepUpPassword?: string;
}

function applyRevalidation(targets: RevalidateTarget[]) {
  for (const target of targets) {
    if (typeof target === "string") {
      revalidatePath(target);
      continue;
    }

    revalidatePath(target.path, target.type);
  }
}

export async function runAdminMutation<T = unknown>(
  options: RunAdminMutationOptions<T>
): Promise<ActionResult<T>> {
  const requestHeaders = await headers();
  const clientIpKey = buildIpRateLimitKeyFromHeaders(requestHeaders);

  if (!isTrustedMutationOrigin(requestHeaders, options.route)) {
    recordSuspiciousActivity(clientIpKey, 3);
    logEvent({
      level: "warn",
      event: "admin_mutation_origin_rejected",
      route: options.route,
      meta: {
        origin: requestHeaders.get("origin") ?? undefined,
        referer: requestHeaders.get("referer") ?? undefined,
      },
    });
    return { success: false, error: "Istek kaynagi dogrulanamadi" };
  }

  const suspicionDecision = getSuspicionDecision(clientIpKey);
  if (suspicionDecision.blocked) {
    return { success: false, error: "Supheli yonetim trafigi gecici olarak engellendi" };
  }

  const contentLength = Number(requestHeaders.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 1_500_000) {
    recordSuspiciousActivity(clientIpKey, 2);
    return { success: false, error: "Istek boyutu desteklenmiyor" };
  }

  const admin = await requireAdmin();
  const perIpDecision = getRateLimitDecisionByKey(
    {
      scope: "admin-mutation-ip",
      limit: 20,
      windowMs: 60 * 1000,
      keySuffix: options.route,
    },
    clientIpKey
  );
  if (!perIpDecision.allowed) {
    recordSuspiciousActivity(clientIpKey, 1);
    return { success: false, error: "Cok fazla yonetim islemi yapildi. Lutfen biraz sonra tekrar deneyin." };
  }

  const perAdminDecision = getRateLimitDecisionByKey(
    {
      scope: "admin-mutation-admin",
      limit: 40,
      windowMs: 60 * 1000,
      keySuffix: `${admin.id}:${options.route}`,
    },
    clientIpKey
  );
  if (!perAdminDecision.allowed) {
    recordSuspiciousActivity(clientIpKey, 1);
    return { success: false, error: "Yonetim islemi gecici olarak yavaslatildi. Lutfen biraz sonra tekrar deneyin." };
  }

  if (options.requireStepUp) {
    const alreadyVerified = await hasRecentAdminStepUp(admin.id);
    if (!alreadyVerified) {
      const validStepUp = await verifyStepUpPassword(options.stepUpPassword, admin.passwordHash);
      if (!validStepUp) {
        recordSuspiciousActivity(clientIpKey, 2);
        return { success: false, error: "Bu islem icin admin sifresiyle tekrar dogrulama gerekli." };
      }

      await grantRecentAdminStepUp(admin.id);
    }
  }

  try {
    const result = await runWithCircuitBreaker(
      "admin-mutations",
      { failureThreshold: 5, cooldownMs: 30_000, halfOpenMaxConcurrent: 1 },
      () =>
        runWithConcurrencyLimit("admin-mutations-global", 8, () =>
          runWithConcurrencyLimit(`admin-mutation-route:${options.route}`, 2, () =>
            runWithTimeout(12_000, () => options.execute())
          )
        )
    );

    logAdminEvent({
      admin,
      event: options.event,
      route: options.route,
      meta: result.meta,
    });

    if (result.revalidate?.length) {
      applyRevalidation(result.revalidate);
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
    };
  } catch (error) {
    if (error instanceof ResilienceError) {
      recordSuspiciousActivity(clientIpKey, error.code === "CIRCUIT_OPEN" ? 2 : 1);
    }

    const message = options.getErrorMessage?.(error) ?? "Islem tamamlanamadi";

    logAdminEvent({
      admin,
      event: `${options.event}_failed`,
      route: options.route,
      message: error instanceof Error ? error.message : "Unknown admin mutation error",
      meta: {
        failureMessage: message,
        resilienceCode: error instanceof ResilienceError ? error.code : undefined,
      },
    });

    return {
      success: false,
      error: error instanceof ResilienceError ? "Yonetim servisi gecici olarak yogun. Lutfen tekrar deneyin." : message,
    };
  }
}
