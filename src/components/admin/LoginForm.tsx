"use client";

import { startTransition, useActionState } from "react";
import { loginAction } from "@/actions/auth";
import SpamProtectionFields from "@/components/shared/SpamProtectionFields";
import type { ActionResult } from "@/types";

const initialState: ActionResult = { success: false };

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form
      action={(fd) => {
        startTransition(() => {
          void formAction(fd);
        });
      }}
      className="surface-panel space-y-4 p-7"
    >
      <SpamProtectionFields />
      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
      ) : null}
      <div>
        <label className="form-label">E-posta</label>
        <input name="email" type="email" className="form-input" required autoComplete="email" />
      </div>
      <div>
        <label className="form-label">Şifre</label>
        <input name="password" type="password" className="form-input" required autoComplete="current-password" />
      </div>
      <button type="submit" disabled={isPending} className="btn-primary w-full py-3.5">
        {isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}
