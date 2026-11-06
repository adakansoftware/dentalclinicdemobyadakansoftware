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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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
            ? "Ekibimizdeki uzman hekimlerin biyografilerini, uzmanlık alanlarını ve ilgilendikleri tedavileri inceleyebilirsiniz."
            : "Explore the biographies, areas of expertise, and treatments our specialist clinicians focus on."
        }
        minimal
      >
        <div className="hero-panel hero-panel--compact p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="metric-card p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">
                {lang === "tr" ? "Uzman sayısı" : "Specialist count"}
              </div>
              <div className="mt-3 text-3xl font-bold tracking-[-0.01em] text-[color:var(--text-primary)]">{specialists.length}</div>
            </div>
            <div className="metric-card p-5 text-sm leading-relaxed text-[color:var(--text-secondary)]">
              {lang === "tr" ? "Uzmanlık alanına göre hekim seçebilirsiniz." : "Choose a clinician by area of expertise."}
            </div>
          </div>
        </div>
      </PageHero>

      <section className="section-block">
        <div className="section-shell">
          {specialists.length === 0 ? (
            <div className="surface-panel p-12 text-center text-[color:var(--text-secondary)]">
              {lang === "tr"
                ? "Şu anda listelenebilir bir uzman bulunmuyor. Randevu için bize ulaşabilirsiniz."
                : "There are no specialists listed at the moment. You can contact us to book an appointment."}
            </div>
          ) : (
            <>
              <SectionIntro
                title={
                  lang === "tr"
                    ? "Uzmanları tanımak, tedavi güveninin önemli bir parçası"
                    : "Meeting the specialists is an important part of treatment trust"
                }
                subtitle={
                  lang === "tr"
                    ? "Her hekimin uzmanlık alanları, deneyimi ve ilgilendiği tedaviler profilinde düzenli olarak yer alır."
                    : "Each profile clearly presents the clinician's expertise, experience, and relevant treatments."
                }
              />

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {specialists.map((specialist) => {
              const expertise =
                specialist.services?.slice(0, 3).map((service) => (lang === "tr" ? service.nameTr : service.nameEn)) ?? [];
              const bio = lang === "tr" ? specialist.biographyTr : specialist.biographyEn;

              return (
                <article key={specialist.id} className="card group flex h-full flex-col overflow-hidden">
                  <div className="relative aspect-[4/4.5] overflow-hidden bg-[color:var(--surface-muted)]">
                    {specialist.photoUrl ? (
                      <Image
                        src={specialist.photoUrl}
                        alt={lang === "tr" ? specialist.nameTr : specialist.nameEn}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="image-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        unoptimized={specialist.photoUrl.startsWith("data:")}
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-main)]">
                        {getInitials(lang === "tr" ? specialist.nameTr : specialist.nameEn)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-[1.55rem] font-bold tracking-[-0.01em] text-[color:var(--text-primary)]">
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
            </>
          )}
        </div>
      </section>
    </>
  );
}
