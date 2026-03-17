"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";

interface SpecialistPreview {
  id: string; slug: string; nameTr: string; nameEn: string;
  titleTr: string; titleEn: string; photoUrl: string;
}

interface ServiceWithSpecialists {
  id: string; slug: string; nameTr: string; nameEn: string;
  descriptionTr: string; descriptionEn: string; shortDescTr: string; shortDescEn: string;
  iconName: string; durationMinutes: number;
  specialistServices: { specialist: SpecialistPreview }[];
}

interface Props { service: ServiceWithSpecialists; }

export default function ServiceDetailClient({ service }: Props) {
  const { lang } = useLang();

  const name = lang === "tr" ? service.nameTr : service.nameEn;
  const desc = lang === "tr" ? service.descriptionTr : service.descriptionEn;

  return (
    <>
      <div className="py-16 text-center text-white" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #145470))" }}>
        <div className="text-5xl mb-4">🦷</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">{name}</h1>
        <p className="text-white/70 text-sm">
          {t("services", "duration", lang)}: {service.durationMinutes} {t("services", "minutes", lang)}
        </p>
      </div>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-10">
            <p className="text-lg">{desc}</p>
          </div>

          <div className="text-center mb-12">
            <Link href={`/appointment?service=${service.id}`} className="btn-primary text-base px-10 py-4 rounded-xl font-bold">
              {t("services", "bookNow", lang)}
            </Link>
          </div>

          {service.specialistServices.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{t("specialists", "title", lang)}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {service.specialistServices.map(({ specialist: sp }) => (
                  <Link key={sp.id} href={`/specialists/${sp.slug}`} className="card p-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ background: "var(--color-primary-light)" }}>
                      {sp.photoUrl ? <img src={sp.photoUrl} alt={sp.nameTr} className="w-full h-full rounded-full object-cover" /> : "👨‍⚕️"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{lang === "tr" ? sp.nameTr : sp.nameEn}</p>
                      <p className="text-xs text-gray-500">{lang === "tr" ? sp.titleTr : sp.titleEn}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
