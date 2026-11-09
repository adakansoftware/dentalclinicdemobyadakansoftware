"use client";

import type { SummaryRow } from "./types";

interface Props {
  lang: "tr" | "en";
  summaryRows: SummaryRow[];
}

export default function SummaryPanel({ lang, summaryRows }: Props) {
  return (
    <div className="surface-panel p-6">
      <h3 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
        {lang === "tr" ? "Seçimleriniz" : "Your selections"}
      </h3>
      {summaryRows.length === 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-[color:var(--text-secondary)]">
          {lang === "tr" ? "Seçimleriniz burada özet olarak görünecektir." : "Your selections will appear here as a summary."}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {summaryRows.map((row) => (
            <div key={row.label} className="summary-row">
              <span className="text-[color:var(--text-secondary)]">{row.label}</span>
              <span className="ml-6 text-right font-semibold text-[color:var(--text-primary)]">{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
