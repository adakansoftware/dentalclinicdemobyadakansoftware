"use client";

import LocaleLink from "@/components/shared/LocaleLink";

interface Props {
  lang: "tr" | "en";
}

export default function FinalCta({ lang }: Props) {
  return (
    <section className="section-block pt-0">
      <div className="section-shell">
        <div className="quiet-cta-band px-7 py-8 md:px-10 md:py-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-[-0.01em] text-[color:var(--text-primary)] md:text-4xl">
                {lang === "tr" ? "Muayenenizi planlamak için ilk adımı şimdi atın" : "Take the first step now to plan your dental visit"}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--text-secondary)]">
                {lang === "tr" ? "Uygun hizmeti, hekimi ve tarihi seçerek online randevu talebinizi birkaç adımda iletebilirsiniz." : "Choose the right treatment, clinician, and date to send your appointment request in just a few steps."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <LocaleLink href="/appointment" className="btn-primary">
                {lang === "tr" ? "Online Randevu Al" : "Book Appointment"}
              </LocaleLink>
              <LocaleLink href="/contact" className="btn-ghost">
                {lang === "tr" ? "İletişim" : "Contact"}
              </LocaleLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
