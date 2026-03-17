"use client";

import { useActionState, startTransition } from "react";
import { loginAction } from "@/actions/auth";
import type { ActionResult } from "@/types";

const initialState: ActionResult = { success: false };

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form
      action={(fd) => { startTransition(() => { void formAction(fd); }); }}
      className="card p-6 space-y-4"
    >
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {state.error}
        </div>
      )}
      <div>
        <label className="form-label">E-posta</label>
        <input name="email" type="email" className="form-input" required autoComplete="email" />
      </div>
      <div>
        <label className="form-label">Şifre</label>
        <input name="password" type="password" className="form-input" required autoComplete="current-password" />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all"
        style={{ background: "var(--color-primary, #1a6b8a)" }}
      >
        {isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}
