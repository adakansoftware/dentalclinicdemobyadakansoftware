"use client";

import type { ServiceData } from "@/types";
import { t } from "@/lib/translations";
import type { StepServiceProps } from "./types";

export default function StepService({ lang, services, selectedServiceId, onSelect }: StepServiceProps) {
  return (
    <div className="step-shell p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="step-badge">01</div>
        <h2 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
          {t("appointment", "step1", lang)}
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service: ServiceData) => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            className={`selection-card flex min-h-[172px] w-full flex-col items-start overflow-hidden p-5 text-left ${
              selectedServiceId === service.id ? "selection-card--active" : ""
            }`}
          >
            <div className="service-chip w-fit">
              {service.durationMinutes} {t("services", "minutes", lang)}
            </div>
            <div className="mt-4 text-[1.05rem] font-semibold leading-tight text-[color:var(--text-primary)] md:text-[1.12rem]">
              {lang === "tr" ? service.nameTr : service.nameEn}
            </div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)] break-words">
              {lang === "tr" ? service.shortDescTr : service.shortDescEn}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
