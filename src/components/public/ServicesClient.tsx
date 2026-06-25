"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/context/LangContext";
import SectionIntro from "@/components/shared/SectionIntro";
import PageHero from "@/components/shared/PageHero";
import { getServiceImage } from "@/lib/service-images";
import { t } from "@/lib/translations";
import type { ServiceData } from "@/types";

interface Props {
  services: ServiceData[];
}

const SERVICE_VISUALS = {
  feature: "/images/editorial/clinic-interior.jpg",
  portrait: "/images/editorial/doctor-female.jpg",
} as const;

const SERVICE_TR_FALLBACKS: Record<string, string> = {
  implant: "Eksik dişler için planlı, estetik ve kalıcı çözüm",
  ortodonti: "Diş teli ve şeffaf plak ile düzenli gülüş planlaması",
  "dis-beyazlatma": "Daha parlak ve doğal bir gülüş için klinik beyazlatma uygulaması",
  "kanal-tedavisi": "Doğal dişi korumaya odaklanan kök kanal tedavisi",
};

export default function ServicesClient({ services }: Props) {
  const { lang } = useLang();
  const highlightedVisuals = services.slice(0, 4).map((service, index) => ({
    id: service.id,
    slug: service.slug,
    title: lang === "tr" ? service.nameTr : service.nameEn,
    description:
      lang === "tr"
        ? SERVICE_TR_FALLBACKS[service.slug] ?? service.shortDescTr
        : service.shortDescEn,
    image: service.imageUrl || getServiceImage(service.slug),
    accent: `0${index + 1}`,
  }));

  return (
    <>
      <PageHero
        title={t("services", "title", lang)}
        subtitle={
          lang === "tr"
            ? "Muayene ve tedavi ihtiyacınıza göre uygulamalarımızı, sürelerini ve başvuru adımlarını inceleyebilirsiniz."
            : "Review our treatments, estimated durations, and booking paths according to your examination and care needs."
        }
        minimal
      >
        <div className="hero-panel hero-panel--compact p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="metric-card p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">
                {lang === "tr" ? "Hizmet sayısı" : "Service count"}
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--text-primary)]">{services.length}</div>
            </div>
            <div className="metric-card p-5 text-sm leading-relaxed text-[color:var(--text-secondary)]">
              {lang === "tr"
                ? "Her hizmette uygulama amacı, ortalama süre ve randevu yönlendirmesi bulunur."
                : "Each treatment includes its purpose, approximate duration, and a direct booking path."}
            </div>
          </div>
        </div>
      </PageHero>

      <section className="section-block">
        <div className="section-shell">
          {highlightedVisuals.length > 0 ? (
            <div className="featured-split-card mb-12 grid gap-0 overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
              <div className="featured-split-card__media min-h-[340px]">
                <Image
                  src={SERVICE_VISUALS.feature}
                  alt={highlightedVisuals[0].title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 52vw"
                  className="image-cover"
                />
                <div className="featured-split-card__overlay" />
                <div className="featured-split-card__badge">
                  {lang === "tr" ? "Bilgilendirme Alanı" : "Treatment Focus"}
                </div>
              </div>

              <div className="featured-split-card__content">
                <div className="featured-split-card__meta">{highlightedVisuals[0].accent}</div>
                <h2 className="featured-split-card__title">{highlightedVisuals[0].title}</h2>
                <p className="featured-split-card__body">{highlightedVisuals[0].description}</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {highlightedVisuals.slice(1).map((item, index) => (
                    <div key={item.id} className="stack-card overflow-hidden p-3">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.1rem]">
                        <Image
                          src={index === 0 ? SERVICE_VISUALS.portrait : item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 20vw"
                          className="image-cover"
                        />
                      </div>
                      <div className="px-2 pb-2 pt-4">
                        <div className="stack-card__meta">{item.accent}</div>
                        <h3 className="stack-card__title">{item.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[color:var(--text-secondary)]">{item.description}</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link href={`/services/${item.slug}`} className="btn-ghost">
                            {lang === "tr" ? "Detayları İncele" : "Explore Details"}
                          </Link>
                          <Link href={`/appointment?service=${item.id}`} className="btn-outline">
                            {lang === "tr" ? "Randevu Al" : "Book Appointment"}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="featured-split-card__actions">
                  <Link href={services[0] ? `/appointment?service=${services[0].id}` : "/appointment"} className="btn-primary">
                    {lang === "tr" ? "Randevu Al" : "Book Appointment"}
                  </Link>
                  <Link href={services[0] ? `/services/${services[0].slug}` : "/services"} className="btn-ghost">
                    {lang === "tr" ? "Detayları İncele" : "Explore Details"}
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          <SectionIntro
            title={
              lang === "tr"
                ? "Hangi tedavinin size uygun olduğunu daha kolay karşılaştırın"
                : "Compare treatments more easily to find the care that suits you"
            }
            subtitle={
              lang === "tr"
                ? "Hizmetlerimiz; işlem kapsamı, ortalama süre ve randevu adımı ile birlikte açık bir düzende listelenir."
                : "Our services are listed with procedure scope, estimated duration, and a direct booking option."
            }
          />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article key={service.id} className="card flex h-full flex-col overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden bg-[color:var(--surface-muted)]">
                  <Image
                    src={service.imageUrl || getServiceImage(service.slug)}
                    alt={lang === "tr" ? service.nameTr : service.nameEn}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="image-cover transition-transform duration-500 hover:scale-[1.02]"
                  />
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="service-chip w-fit">
                    {service.durationMinutes} {t("services", "minutes", lang)}
                  </div>
                  <h3 className="mt-4 text-[1.6rem] font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">
                    {lang === "tr" ? service.nameTr : service.nameEn}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[color:var(--text-secondary)]">
                    {lang === "tr" ? SERVICE_TR_FALLBACKS[service.slug] ?? service.shortDescTr : service.shortDescEn}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href={`/services/${service.slug}`} className="btn-ghost">
                      {lang === "tr" ? "Detayları İncele" : "Details"}
                    </Link>
                    <Link href={`/appointment?service=${service.id}`} className="btn-outline">
                      {lang === "tr" ? "Randevu Al" : "Appointment"}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
