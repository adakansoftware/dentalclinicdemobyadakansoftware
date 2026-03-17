"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import type { ServiceData } from "@/types";

interface Props { services: ServiceData[]; }

export default function ServicesClient({ services }: Props) {
  const { lang } = useLang();

  return (
    <>
      <div className="py-16 text-center text-white" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #145470))" }}>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("services", "title", lang)}</h1>
        <p className="text-white/80 text-lg">{t("services", "subtitle", lang)}</p>
      </div>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((svc) => (
              <div key={svc.id} className="card p-6 flex flex-col">
                <div className="text-4xl mb-4">🦷</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {lang === "tr" ? svc.nameTr : svc.nameEn}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
                  {lang === "tr" ? svc.shortDescTr : svc.shortDescEn}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  {t("services", "duration", lang)}: {svc.durationMinutes} {t("services", "minutes", lang)}
                </p>
                <div className="flex gap-2 mt-auto">
                  <Link href={`/services/${svc.slug}`} className="btn-outline text-sm px-4 py-2 flex-1 text-center">
                    {t("home", "learnMore", lang)}
                  </Link>
                  <Link href={`/appointment?service=${svc.id}`} className="btn-primary text-sm px-4 py-2 flex-1 text-center">
                    {t("services", "bookNow", lang)}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
