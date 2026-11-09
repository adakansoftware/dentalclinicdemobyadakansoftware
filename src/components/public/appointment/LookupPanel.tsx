"use client";

import { startTransition } from "react";
import SpamProtectionFields from "@/components/shared/SpamProtectionFields";
import { t } from "@/lib/translations";
import type { ActionResult, PublicAppointmentLookupItem } from "@/types";
import { getPublicStatusMeta } from "./status-meta";

interface Props {
  lang: "tr" | "en";
  lookupState: ActionResult<PublicAppointmentLookupItem[]>;
  isLookupPending: boolean;
  lookupFormAction: (formData: FormData) => void;
}

export default function LookupPanel({ lang, lookupState, isLookupPending, lookupFormAction }: Props) {
  return (
    <div className="surface-panel p-6">
      <h3 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
        {lang === "tr" ? "Randevularımı Görüntüle" : "View My Appointments"}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-[color:var(--text-secondary)]">
        {lang === "tr"
          ? "Ad-soyad ve telefon numaranız ile yaklaşan randevularınızı görüntüleyebilirsiniz."
          : "View your upcoming appointments with your full name and phone number."}
      </p>

      {lookupState.error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{lookupState.error}</div>
      ) : null}
      {lookupState.success && lookupState.message ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{lookupState.message}</div>
      ) : null}

      <form
        action={(formData) => {
          startTransition(() => {
            void lookupFormAction(formData);
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

        <button type="submit" disabled={isLookupPending} className="btn-ghost w-full">
          {isLookupPending ? t("common", "loading", lang) : lang === "tr" ? "Telefon ile Randevularımı Getir" : "Find My Appointments"}
        </button>
      </form>

      {lookupState.success && lookupState.data?.length ? (
        <div className="mt-5 space-y-3">
          {lookupState.data.map((appointment) => (
            <div key={appointment.id} className="summary-row">
              <div>
                <div className="font-semibold text-[color:var(--text-primary)]">{appointment.serviceName}</div>
                <div className="mt-1 text-xs text-[color:var(--text-secondary)]">{appointment.specialistName}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-[color:var(--text-primary)]">
                  {appointment.date} / {appointment.startTime}
                </div>
                <div className="mt-2 flex justify-end">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getPublicStatusMeta(appointment.status, lang).className}`}
                  >
                    {getPublicStatusMeta(appointment.status, lang).label}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
