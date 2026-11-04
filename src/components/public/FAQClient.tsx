"use client";

import { useState } from "react";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import PageHero from "@/components/shared/PageHero";

import type { FAQData } from "@/types";

interface Props {
  faqs: FAQData[];
}

export default function FAQClient({ faqs }: Props) {
  const { lang } = useLang();
  const [open, setOpen] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <>
      <PageHero
        kicker="FAQ"
        title={t("faq", "title", lang)}
        subtitle={t("faq", "subtitle", lang)}
        minimal
      >
        <div className="hero-panel hero-panel--compact p-6 text-sm leading-relaxed text-[color:var(--text-secondary)]">
          {lang === "tr"
            ? "Sık sorulan başlıklar daha sakin bir okuma akışı ile listelenir."
            : "Frequently asked topics are listed in a calmer reading flow."}
        </div>
      </PageHero>

      <section className="section-block">
        <div className="section-shell">
          <div className="mx-auto max-w-4xl">
            {faqs.length === 0 ? (
              <div className="surface-panel p-10 text-center text-[color:var(--text-secondary)]">
                {lang === "tr" ? "Henüz SSS eklenmemiş." : "No FAQ items yet."}
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq, index) => {
                  const active = open === faq.id;

                  return (
                    <article key={faq.id} className="surface-panel overflow-hidden">
                      <button
                        onClick={() => setOpen(active ? null : faq.id)}
                        aria-expanded={active}
                        className="flex w-full items-start justify-between gap-4 px-6 py-6 text-left"
                      >
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <div className="mt-3 text-lg font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
                            {lang === "tr" ? faq.questionTr : faq.questionEn}
                          </div>
                        </div>
                        <span
                          className={`mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(207,216,211,0.9)] text-[color:var(--accent-main)] transition-transform duration-300 ${
                            active ? "rotate-180" : ""
                          }`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </button>

                      {active ? (
                        <div className="border-t border-[rgba(207,216,211,0.84)] px-6 pb-6 pt-5 text-sm leading-relaxed text-[color:var(--text-secondary)] md:text-base">
                          {lang === "tr" ? faq.answerTr : faq.answerEn}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
