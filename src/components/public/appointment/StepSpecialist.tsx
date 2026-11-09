"use client";

import Image from "next/image";
import { t } from "@/lib/translations";
import type { SpecialistItem } from "./types";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

interface Props {
  lang: "tr" | "en";
  specialists: SpecialistItem[];
  selectedSpecialistId?: string;
  onSelect: (specialist: SpecialistItem) => void;
  onBack: () => void;
}

export default function StepSpecialist({ lang, specialists, selectedSpecialistId, onSelect, onBack }: Props) {
  return (
    <div className="step-shell p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="step-badge">02</div>
        <h2 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
          {t("appointment", "step2", lang)}
        </h2>
      </div>

      {specialists.length === 0 ? (
        <p className="text-[color:var(--text-secondary)]">{t("appointment", "noSpecialists", lang)}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {specialists.map((specialist) => (
            <button
              key={specialist.id}
              onClick={() => onSelect(specialist)}
              className={`selection-card flex min-h-[112px] w-full items-center gap-4 overflow-hidden p-5 text-left ${
                selectedSpecialistId === specialist.id ? "selection-card--active" : ""
              }`}
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[color:var(--surface-muted)]">
                {specialist.photoUrl ? (
                  <Image
                    src={specialist.photoUrl}
                    alt={lang === "tr" ? specialist.nameTr : specialist.nameEn}
                    width={64}
                    height={64}
                    sizes="64px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-main)]">
                    {getInitials(lang === "tr" ? specialist.nameTr : specialist.nameEn)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[1.02rem] font-semibold leading-tight text-[color:var(--text-primary)]">
                  {lang === "tr" ? specialist.nameTr : specialist.nameEn}
                </div>
                <div className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)] break-words">
                  {lang === "tr" ? specialist.titleTr : specialist.titleEn}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <button onClick={onBack} className="mt-6 text-sm text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]">
        <span aria-hidden="true">←</span> {t("appointment", "back", lang)}
      </button>
    </div>
  );
}
