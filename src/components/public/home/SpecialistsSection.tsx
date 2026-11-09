"use client";

import LocaleLink from "@/components/shared/LocaleLink";
import SectionIntro from "@/components/shared/SectionIntro";
import DoctorCard from "@/components/shared/DoctorCard";
import type { SpecialistData } from "@/types";

interface Props {
  lang: "tr" | "en";
  specialists: SpecialistData[];
}

export default function SpecialistsSection({ lang, specialists }: Props) {
  const visibleSpecialists = specialists.slice(0, 3);

  return (
    <section className="section-block">
      <div className="section-shell">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionIntro
            kicker={lang === "tr" ? "Uzman Kadro" : "Specialists"}
            title={lang === "tr" ? "Tedavi sürecinizde size eşlik edecek hekimleri tanıyın" : "Meet the clinicians who will support your treatment journey"}
            subtitle={lang === "tr" ? "Hekimlerimizin uzmanlık alanları, deneyimi ve ilgi duyduğu tedaviler tek bakışta görülebilir." : "Each profile shows expertise, experience, and relevant treatment areas at a glance."}
          />
          <LocaleLink href="/specialists" className="btn-ghost w-fit">
            {lang === "tr" ? "Tüm Uzmanlar" : "All Specialists"}
          </LocaleLink>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleSpecialists.map((specialist) => (
            <DoctorCard
              key={specialist.id}
              specialist={specialist}
              href={`/specialists/${specialist.slug}`}
              lang={lang}
              ctaLabel={lang === "tr" ? "Profili İncele" : "View Profile"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
