"use client";

import { useState } from "react";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import type { FAQData } from "@/types";

interface Props { faqs: FAQData[]; }

export default function FAQClient({ faqs }: Props) {
  const { lang } = useLang();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      <div className="py-16 text-center text-white" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #145470))" }}>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("faq", "title", lang)}</h1>
        <p className="text-white/80 text-lg">{t("faq", "subtitle", lang)}</p>
      </div>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {faqs.length === 0 ? (
            <p className="text-center text-gray-500">{lang === "tr" ? "Henüz SSS eklenmemiş." : "No FAQ items yet."}</p>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.id} className="card">
                  <button
                    onClick={() => setOpen(open === faq.id ? null : faq.id)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-semibold text-gray-900"
                  >
                    <span>{lang === "tr" ? faq.questionTr : faq.questionEn}</span>
                    <span className="text-2xl transition-transform shrink-0" style={{ transform: open === faq.id ? "rotate(45deg)" : "rotate(0)" }}>+</span>
                  </button>
                  {open === faq.id && (
                    <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {lang === "tr" ? faq.answerTr : faq.answerEn}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
