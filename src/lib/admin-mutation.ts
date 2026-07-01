import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logAdminEvent } from "@/lib/admin-audit";
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
  const admin = await requireAdmin();

  try {
    const result = await options.execute();

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
    const message = options.getErrorMessage?.(error) ?? "Islem tamamlanamadi";

    logAdminEvent({
      admin,
      event: `${options.event}_failed`,
      route: options.route,
      message: error instanceof Error ? error.message : "Unknown admin mutation error",
      meta: {
        failureMessage: message,
      },
    });

    return {
      success: false,
      error: message,
    };
  }
}
