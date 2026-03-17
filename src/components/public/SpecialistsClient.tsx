"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";

interface ServiceItem { id: string; nameTr: string; nameEn: string; }
interface SpecialistItem {
  id: string; slug: string; nameTr: string; nameEn: string;
  titleTr: string; titleEn: string; biographyTr: string; biographyEn: string;
  photoUrl: string;
  specialistServices: { service: ServiceItem }[];
}

interface Props { specialists: SpecialistItem[]; }

export default function SpecialistsClient({ specialists }: Props) {
  const { lang } = useLang();

  return (
    <>
      <div className="py-16 text-center text-white" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #145470))" }}>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("specialists", "title", lang)}</h1>
        <p className="text-white/80 text-lg">{t("specialists", "subtitle", lang)}</p>
      </div>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {specialists.map((sp) => (
              <div key={sp.id} className="card overflow-hidden flex flex-col">
                <div className="h-52 flex items-center justify-center" style={{ background: "var(--color-primary-light)" }}>
                  {sp.photoUrl ? (
                    <img src={sp.photoUrl} alt={sp.nameTr} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-6xl">👨‍⚕️</div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{lang === "tr" ? sp.nameTr : sp.nameEn}</h2>
                  <p className="text-sm font-medium mb-3" style={{ color: "var(--color-primary)" }}>
                    {lang === "tr" ? sp.titleTr : sp.titleEn}
                  </p>
                  {sp.specialistServices.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {sp.specialistServices.slice(0, 3).map(({ service }) => (
                        <span key={service.id} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {lang === "tr" ? service.nameTr : service.nameEn}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto flex gap-2">
                    <Link href={`/specialists/${sp.slug}`} className="btn-outline text-sm px-4 py-2 flex-1 text-center">
                      {t("home", "learnMore", lang)}
                    </Link>
                    <Link href={`/appointment?specialist=${sp.id}`} className="btn-primary text-sm px-4 py-2 flex-1 text-center">
                      {t("specialists", "bookWith", lang)}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
