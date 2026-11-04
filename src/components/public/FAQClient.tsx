"use client";

import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import PageHero from "@/components/shared/PageHero";
import FAQAccordion from "@/components/shared/FAQAccordion";

import type { FAQData } from "@/types";

interface Props {
  faqs: FAQData[];
}

export default function FAQClient({ faqs }: Props) {
  const { lang } = useLang();

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
              <FAQAccordion
                defaultOpen={0}
                items={faqs.map((faq) => ({
                  question: lang === "tr" ? faq.questionTr : faq.questionEn,
                  answer: lang === "tr" ? faq.answerTr : faq.answerEn,
                }))}
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
