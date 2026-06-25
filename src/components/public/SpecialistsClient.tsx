"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/context/LangContext";
import SectionIntro from "@/components/shared/SectionIntro";
import { t } from "@/lib/translations";
import PageHero from "@/components/shared/PageHero";
import type { SpecialistData } from "@/types";

interface Props {
  specialists: SpecialistData[];
}

function truncate(text: string, max = 170) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

export default function SpecialistsClient({ specialists }: Props) {
  const { lang } = useLang();

  return (
    <>
      <PageHero
        kicker={lang === "tr" ? "Uzman Kadro" : "Specialists"}
        title={t("specialists", "title", lang)}
        subtitle={
          lang === "tr"
            ? "Uzman profilleri; biyografi, alanlar ve ilgili randevu geçişlerini daha sakin ve düzenli bir kurgu ile sunar."
            : "Specialist profiles organize biography, focus areas, and booking access in a calmer, more refined composition."
        }
        minimal
      >
        <div className="hero-panel hero-panel--compact p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="metric-card p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">
                {lang === "tr" ? "Uzman sayısı" : "Specialist count"}
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--text-primary)]">{specialists.length}</div>
            </div>
            <div className="metric-card p-5 text-sm leading-relaxed text-[color:var(--text-secondary)]">
              {lang === "tr" ? "Profesyonel ama insani bir sunum dili." : "A presentation language that feels professional yet human."}
            </div>
          </div>
        </div>
      </PageHero>

      <section className="section-block">
        <div className="section-shell">
          <SectionIntro
            title={
              lang === "tr"
                ? "Uzmanları tanımak, tedavi güveninin önemli bir parçası"
                : "Meeting the specialists is an important part of treatment trust"
            }
            subtitle={
              lang === "tr"
                ? "Kartlar hizmet alanlarından biraz daha sıcak bir ton taşırken kurumsal dengeyi korur."
                : "The cards carry a slightly warmer tone than the service grid while preserving institutional balance."
            }
          />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {specialists.map((specialist) => {
              const expertise =
                specialist.services?.slice(0, 3).map((service) => (lang === "tr" ? service.nameTr : service.nameEn)) ?? [];
              const bio = lang === "tr" ? specialist.biographyTr : specialist.biographyEn;

              return (
                <article key={specialist.id} className="card flex h-full flex-col overflow-hidden bg-[rgba(248,246,241,0.95)]">
                  <div className="relative aspect-[4/4.5] overflow-hidden bg-[color:var(--surface-muted)]">
                    {specialist.photoUrl ? (
                      <Image
                        src={specialist.photoUrl}
                        alt={lang === "tr" ? specialist.nameTr : specialist.nameEn}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="image-cover"
                        unoptimized={specialist.photoUrl.startsWith("data:")}
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-sm uppercase tracking-[0.2em] text-[color:var(--accent-main)]">
                        Portrait
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-[1.55rem] font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">
                      {lang === "tr" ? specialist.nameTr : specialist.nameEn}
                    </h2>
                    <p className="mt-2 text-sm font-medium text-[color:var(--accent-main)]">
                      {lang === "tr" ? specialist.titleTr : specialist.titleEn}
                    </p>

                    {expertise.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {expertise.map((item) => (
                          <span key={item} className="service-chip">
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <p className="mt-4 flex-1 text-sm leading-relaxed text-[color:var(--text-secondary)]">{truncate(bio)}</p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link href={`/specialists/${specialist.slug}`} className="btn-ghost">
                        {lang === "tr" ? "Profili İncele" : "View Profile"}
                      </Link>
                      <Link href={`/appointment?specialist=${specialist.id}`} className="btn-outline">
                        {lang === "tr" ? "Randevu Al" : "Appointment"}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
