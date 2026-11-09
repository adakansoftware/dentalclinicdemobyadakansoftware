"use client";

import Image from "next/image";
import LocaleLink from "@/components/shared/LocaleLink";
import SectionIntro from "@/components/shared/SectionIntro";
import { getServiceImage } from "@/lib/service-images";
import { t } from "@/lib/translations";
import type { ServiceData } from "@/types";

interface Props {
  lang: "tr" | "en";
  services: ServiceData[];
}

export default function ServicesSection({ lang, services }: Props) {
  const leadService = services[0];
  const visibleServices = services.slice(0, 3);

  return (
    <section className="soft-section section-block">
      <div className="section-shell">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <SectionIntro
            kicker={lang === "tr" ? "Hizmetler" : "Services"}
            title={lang === "tr" ? "Size uygun tedaviyi daha rahat seçebilmeniz için hizmetlerimizi inceleyin" : "Review our treatments to choose the care that fits your needs"}
            subtitle={lang === "tr" ? "Her hizmet kartında uygulamanın kısa özeti, ortalama süre ve randevu yönlendirmesi birlikte yer alır." : "Each treatment card includes a short overview, estimated duration, and a direct booking path."}
          />
          <LocaleLink href="/services" className="btn-ghost w-fit">
            {lang === "tr" ? "Tüm Hizmetler" : "All Services"}
          </LocaleLink>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleServices.map((service) => (
            <article key={service.id} className="card group flex h-full flex-col overflow-hidden">
              <div className="relative aspect-[4/3] overflow-hidden bg-[color:var(--surface-muted)]">
                <Image src={service.imageUrl || getServiceImage(service.slug)} alt={lang === "tr" ? service.nameTr : service.nameEn} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="image-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="service-chip w-fit">
                  {service.durationMinutes} {t("services", "minutes", lang)}
                </div>
                <h3 className="mt-4 text-[1.65rem] font-bold tracking-[-0.01em] text-[color:var(--text-primary)]">
                  {lang === "tr" ? service.nameTr : service.nameEn}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[color:var(--text-secondary)] md:text-base">
                  {lang === "tr" ? service.shortDescTr : service.shortDescEn}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <LocaleLink href={`/services/${service.slug}`} className="btn-ghost">
                    {lang === "tr" ? "Detayları İncele" : "Details"}
                  </LocaleLink>
                  <LocaleLink href={`/appointment?service=${service.id}`} className="btn-outline">
                    {lang === "tr" ? "Randevu Al" : "Appointment"}
                  </LocaleLink>
                </div>
              </div>
            </article>
          ))}
        </div>

        {leadService ? (
          <div className="quiet-cta-band mt-10 p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <h3 className="text-3xl font-bold tracking-[-0.01em] text-[color:var(--text-primary)]">
                  {lang === "tr" ? leadService.nameTr : leadService.nameEn}
                </h3>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--text-secondary)]">
                  {lang === "tr" ? leadService.shortDescTr : leadService.shortDescEn}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <LocaleLink href={`/services/${leadService.slug}`} className="btn-ghost">
                  {lang === "tr" ? "Tedavi Detayları" : "Treatment Details"}
                </LocaleLink>
                <LocaleLink href={`/appointment?service=${leadService.id}`} className="btn-primary">
                  {lang === "tr" ? "Online Randevu Al" : "Book Appointment"}
                </LocaleLink>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
