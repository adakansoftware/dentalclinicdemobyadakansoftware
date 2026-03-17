"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function updateSettingsAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const updates: Promise<unknown>[] = [];
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && key !== "" ) {
      updates.push(
        prisma.siteSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      );
    }
  }

  await Promise.all(updates);
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return { success: true };
}
