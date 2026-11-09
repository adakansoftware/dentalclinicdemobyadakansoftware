"use client";

import { t } from "@/lib/translations";
import type { TimeSlot } from "@/types";

interface Props {
  lang: "tr" | "en";
  today: string;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  slots: TimeSlot[];
  slotsLoading: boolean;
  onDateChange: (date: string) => void;
  onSlotSelect: (slot: TimeSlot) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function StepDateTime({
  lang,
  today,
  selectedDate,
  selectedSlot,
  slots,
  slotsLoading,
  onDateChange,
  onSlotSelect,
  onBack,
  onNext,
}: Props) {
  return (
    <div className="step-shell p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="step-badge">03</div>
        <h2 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
          {t("appointment", "step3", lang)}
        </h2>
      </div>

      <div className="mb-6 max-w-xs">
        <label className="form-label">{t("appointment", "date", lang)}</label>
        <input
          type="date"
          min={today}
          value={selectedDate}
          onChange={(event) => onDateChange(event.target.value)}
          className="form-input"
        />
      </div>

      {selectedDate ? (
        <div>
          <label className="form-label">{t("appointment", "time", lang)}</label>
          {slotsLoading ? (
            <p className="text-sm text-[color:var(--text-secondary)]">{t("common", "loading", lang)}</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-[color:var(--text-secondary)]">{t("appointment", "noSlots", lang)}</p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {slots.map((slot) => (
                <button
                  key={slot.startTime}
                  disabled={!slot.available}
                  onClick={() => onSlotSelect(slot)}
                  className={`slot-card ${
                    !slot.available
                      ? "slot-card--disabled"
                      : selectedSlot?.startTime === slot.startTime
                        ? "slot-card--active"
                        : ""
                  }`}
                >
                  {slot.startTime}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button onClick={onBack} className="text-sm text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]">
          <span aria-hidden="true">←</span> {t("appointment", "back", lang)}
        </button>
        <button
          onClick={onNext}
          disabled={!selectedSlot}
          className="btn-primary sm:ml-auto disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("appointment", "next", lang)} <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
