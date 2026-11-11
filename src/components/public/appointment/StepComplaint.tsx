"use client";

import { t } from "@/lib/translations";

const MAX_NOTE_LENGTH = 500;

interface Props {
  lang: "tr" | "en";
  complaint: string;
  onChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepComplaint({ lang, complaint, onChange, onBack, onNext }: Props) {
  const trimmed = complaint.trim();

  return (
    <div className="step-shell p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="step-badge">04</div>
        <h2 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
          {t("appointment", "step4", lang)}
        </h2>
      </div>

      <p className="mb-4 max-w-xl text-sm leading-6 text-[color:var(--text-secondary)]">
        {t("appointment", "complaintHint", lang)}
      </p>

      <div>
        <label className="form-label">
          {t("appointment", "complaintLabel", lang)} *
        </label>
        <textarea
          value={complaint}
          onChange={(event) => onChange(event.target.value.slice(0, MAX_NOTE_LENGTH))}
          placeholder={t("appointment", "complaintPlaceholder", lang)}
          className="form-input min-h-[140px]"
          maxLength={MAX_NOTE_LENGTH}
          required
          minLength={3}
        />
        <p className="mt-2 text-right text-xs text-[color:var(--text-secondary)]">
          {complaint.length}/{MAX_NOTE_LENGTH}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={onBack}
          className="text-sm text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]"
        >
          <span aria-hidden="true">←</span> {t("appointment", "back", lang)}
        </button>
        <button
          onClick={onNext}
          disabled={trimmed.length < 3}
          className="btn-primary sm:ml-auto disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("appointment", "next", lang)} <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
