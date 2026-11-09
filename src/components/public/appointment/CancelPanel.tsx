"use client";

import { startTransition } from "react";
import SpamProtectionFields from "@/components/shared/SpamProtectionFields";
import { t } from "@/lib/translations";
import type { ActionResult } from "@/types";

interface Props {
  lang: "tr" | "en";
  today: string;
  cancelState: ActionResult;
  isCancelPending: boolean;
  cancelFormAction: (formData: FormData) => void;
}

export default function CancelPanel({ lang, today, cancelState, isCancelPending, cancelFormAction }: Props) {
  return (
    <div className="surface-panel p-6">
      <h3 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
        {lang === "tr" ? "Randevu İptali" : "Cancel Appointment"}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-[color:var(--text-secondary)]">
        {lang === "tr"
          ? "Ad-soyad, telefon numarası ve randevu tarihiniz ile kayıtlı aktif randevunuzu iptal edebilirsiniz."
          : "Cancel your active appointment using your full name, phone number, and appointment date."}
      </p>

      {cancelState.error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{cancelState.error}</div>
      ) : null}
      {cancelState.success && cancelState.message ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{cancelState.message}</div>
      ) : null}

      <form
        action={(formData) => {
          startTransition(() => {
            void cancelFormAction(formData);
          });
        }}
        className="mt-5 space-y-4"
      >
        <SpamProtectionFields />
        <input type="hidden" name="patientLanguage" value={lang.toUpperCase()} />

        <div>
          <label className="form-label">{t("appointment", "name", lang)} *</label>
          <input name="patientName" className="form-input" required minLength={2} />
        </div>
        <div>
          <label className="form-label">{t("appointment", "phone", lang)} *</label>
          <input name="patientPhone" type="tel" className="form-input" required />
        </div>
        <div>
          <label className="form-label">{t("appointment", "date", lang)} *</label>
          <input name="date" type="date" min={today} className="form-input" required />
        </div>

        <button type="submit" disabled={isCancelPending} className="btn-outline w-full">
          {isCancelPending ? t("common", "loading", lang) : lang === "tr" ? "Telefon ile Randevu İptal Et" : "Cancel by Phone"}
        </button>
      </form>
    </div>
  );
}
