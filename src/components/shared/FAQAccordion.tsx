"use client";

import { useState } from "react";

export interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  items: FAQItem[];
  defaultOpen?: number | null;
}

export default function FAQAccordion({ items, defaultOpen = null }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpen);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question} className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-[rgba(85,145,183,0.04)]"
            >
              <span className="font-bold text-[color:var(--text-primary)]">{item.question}</span>
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className={`h-5 w-5 shrink-0 text-[color:var(--accent-main)] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              >
                <path fillRule="evenodd" d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z" clipRule="evenodd" />
              </svg>
            </button>
            <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="overflow-hidden">
                <p className="px-6 pb-6 text-[15px] leading-relaxed text-[color:var(--text-secondary)]">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
