"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";

interface ServiceItem { id: string; nameTr: string; nameEn: string; slug: string; }
interface SpecialistWithServices {
  id: string; slug: string; nameTr: string; nameEn: string;
  titleTr: string; titleEn: string; biographyTr: string; biographyEn: string;
  photoUrl: string;
  specialistServices: { service: ServiceItem }[];
}

interface Props { specialist: SpecialistWithServices; }

export default function SpecialistDetailClient({ specialist: sp }: Props) {
  const { lang } = useLang();

  const name = lang === "tr" ? sp.nameTr : sp.nameEn;
  const title = lang === "tr" ? sp.titleTr : sp.titleEn;
  const bio = lang === "tr" ? sp.biographyTr : sp.biographyEn;

  return (
    <>
      <div className="py-16 text-white" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #145470))" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center gap-8">
          <div className="w-36 h-36 rounded-full overflow-hidden shrink-0 bg-white/20 flex items-center justify-center text-6xl">
            {sp.photoUrl ? <img src={sp.photoUrl} alt={name} className="w-full h-full object-cover" /> : "👨‍⚕️"}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{name}</h1>
            <p className="text-white/80 text-lg">{title}</p>
          </div>
        </div>
      </div>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {lang === "tr" ? "Biyografi" : "Biography"}
              </h2>
              <p className="text-gray-700 leading-relaxed">{bio}</p>

              <div className="mt-8">
                <Link href={`/appointment?specialist=${sp.id}`} className="btn-primary">
                  {t("specialists", "bookWith", lang)}
                </Link>
              </div>
            </div>

            <div>
              {sp.specialistServices.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-4">{t("specialists", "services", lang)}</h3>
                  <ul className="space-y-2">
                    {sp.specialistServices.map(({ service }) => (
                      <li key={service.id}>
                        <Link href={`/services/${service.slug}`}
                          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors">
                          <span>🦷</span>
                          <span>{lang === "tr" ? service.nameTr : service.nameEn}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
