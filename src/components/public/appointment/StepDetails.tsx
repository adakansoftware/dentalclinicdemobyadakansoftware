"use client";

import { startTransition } from "react";
import SpamProtectionFields from "@/components/shared/SpamProtectionFields";
import { t } from "@/lib/translations";
import type { TimeSlot, ServiceData } from "@/types";
import type { SpecialistItem } from "./types";

interface Props {
  lang: "tr" | "en";
  selectedService: ServiceData;
  selectedSpecialist: SpecialistItem;
  selectedDate: string;
  selectedSlot: TimeSlot;
  isPending: boolean;
  formAction: (formData: FormData) => void;
  onBack: () => void;
}

export default function StepDetails({
  lang,
  selectedService,
  selectedSpecialist,
  selectedDate,
  selectedSlot,
  isPending,
  formAction,
  onBack,
}: Props) {
  return (
    <div className="step-shell p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="step-badge">04</div>
        <h2 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
          {t("appointment", "step4", lang)}
        </h2>
      </div>

      <form
        action={(formData) => {
          startTransition(() => {
            void formAction(formData);
          });
        }}
        className="space-y-4"
      >
        <SpamProtectionFields />
        <input type="hidden" name="serviceId" value={selectedService.id} />
        <input type="hidden" name="specialistId" value={selectedSpecialist.id} />
        <input type="hidden" name="date" value={selectedDate} />
        <input type="hidden" name="startTime" value={selectedSlot.startTime} />
        <input type="hidden" name="endTime" value={selectedSlot.endTime} />
        <input type="hidden" name="patientLanguage" value={lang.toUpperCase()} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="form-label">{t("appointment", "name", lang)} *</label>
            <input name="patientName" className="form-input" required minLength={2} />
          </div>
          <div>
            <label className="form-label">{t("appointment", "phone", lang)} *</label>
            <input name="patientPhone" type="tel" className="form-input" required />
          </div>
        </div>

        <div>
          <label className="form-label">{t("appointment", "email", lang)}</label>
          <input name="patientEmail" type="email" className="form-input" />
        </div>

        <div>
          <label className="form-label">{t("appointment", "note", lang)}</label>
          <textarea name="patientNote" className="form-input min-h-[110px]" />
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <button type="button" onClick={onBack} className="text-sm text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]">
            <span aria-hidden="true">←</span> {t("appointment", "back", lang)}
          </button>
          <button type="submit" disabled={isPending} className="btn-primary sm:ml-auto">
            {isPending ? t("common", "loading", lang) : t("appointment", "confirm", lang)}
          </button>
        </div>
      </form>
    </div>
  );
}
