"use client";

import Image from "next/image";
import { useLang } from "@/context/LangContext";
import SectionIntro from "@/components/shared/SectionIntro";
import { t } from "@/lib/translations";
import PageHero from "@/components/shared/PageHero";
import type { SiteSettings } from "@/types";

interface Props {
  settings: SiteSettings;
}

const ABOUT_VISUALS = {
  clinic: "/images/editorial/clinic-interior.jpg",
  doctor: "/images/editorial/doctor-male.jpg",
  treatment: "/images/editorial/doctor-female.jpg",
} as const;

export default function AboutClient({ settings }: Props) {
  const { lang } = useLang();

  const title = lang === "tr" ? settings.aboutTitleTr : settings.aboutTitleEn;
  const text = lang === "tr" ? settings.aboutTextTr : settings.aboutTextEn;
  const visualMoments = [
    {
      src: ABOUT_VISUALS.clinic,
      alt: lang === "tr" ? "Klinik bekleme ve tedavi alanı" : "Clinic waiting and treatment area",
      label: lang === "tr" ? "Klinik atmosferi" : "Clinic atmosphere",
      className: "lg:col-span-2",
    },
    {
      src: ABOUT_VISUALS.doctor,
      alt: lang === "tr" ? "Uzman hekim portresi" : "Specialist portrait",
      label: lang === "tr" ? "Uzman yaklaşım" : "Specialist approach",
      className: "",
    },
    {
      src: ABOUT_VISUALS.treatment,
      alt: lang === "tr" ? "Tedavi detay görüntüsü" : "Treatment detail image",
      label: lang === "tr" ? "Tedavi detayları" : "Treatment details",
      className: "",
    },
  ];

  const values = [
    {
      number: "01",
      title: lang === "tr" ? "Kişiye özel planlama" : "Personal planning",
      desc:
        lang === "tr"
          ? "Muayene bulguları, beklentiler ve tedavi öncelikleri birlikte değerlendirilir."
          : "Clinical findings, expectations, and treatment priorities are reviewed together.",
    },
    {
      number: "02",
      title: lang === "tr" ? "Açık iletişim" : "Clear communication",
      desc:
        lang === "tr"
          ? "Süreç boyunca düzenli, sakin ve anlaşılır bir bilgilendirme dili korunur."
          : "Communication stays calm, consistent, and easy to understand throughout the process.",
    },
    {
      number: "03",
      title: lang === "tr" ? "Hasta konforu" : "Patient comfort",
      desc:
        lang === "tr"
          ? "Hijyen, düzen ve psikolojik rahatlık klinik deneyimin ayrılmaz bir parçası olarak ele alınır."
          : "Hygiene, order, and emotional comfort are treated as part of the overall clinic experience.",
    },
  ];

  return (
    <>
      <PageHero
        kicker={lang === "tr" ? "Hakkımızda" : "About"}
        title={title}
        subtitle={
          lang === "tr"
            ? "Kliniğimiz; doğru teşhis, açık bilgilendirme ve kişiye özel tedavi planlamasını öncelik kabul eder."
            : "Our clinic prioritizes accurate diagnosis, clear communication, and treatment planning tailored to each patient."
        }
        minimal
      >
        <div className="hero-panel hero-panel--compact p-6 text-sm leading-relaxed text-[color:var(--text-secondary)]">
          {lang === "tr"
            ? "Her hastaya dikkatli takip, anlaşılır bilgi ve konforlu bir klinik deneyimi sunmayı hedefliyoruz."
            : "We aim to offer each patient attentive follow-up, understandable guidance, and a comfortable clinic experience."}
        </div>
      </PageHero>

      <section className="section-block">
        <div className="section-shell">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="editorial-panel p-8 md:p-10">
              <SectionIntro
                title={
                  lang === "tr"
                    ? "Tedavi sürecinde güven ve açık iletişim bizim için esastır"
                    : "Trust and clear communication are essential throughout treatment"
                }
              />
              <p className="whitespace-pre-line text-base leading-relaxed text-[color:var(--text-secondary)] md:text-lg">{text}</p>
            </div>

            <div className="grid gap-5">
              {values.map((item) => (
                <article key={item.title} className="card p-7">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">{item.number}</div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[color:var(--text-secondary)]">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="soft-section section-block">
        <div className="section-shell">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <SectionIntro
              kicker={lang === "tr" ? "Klinik Atmosferi" : "Spatial Feel"}
              title={
                lang === "tr"
                  ? "Klinik ortamını ve tedavi alanlarını önceden görebilirsiniz"
                  : "You can preview the clinic environment and treatment rooms in advance"
              }
              subtitle={
                lang === "tr"
                  ? "Muayene odaları, hekim kadrosu ve uygulama alanları hakkında daha net bir ilk izlenim oluşturuyoruz."
                  : "We provide a clearer first impression of treatment rooms, clinicians, and care spaces."
              }
            />

            <div className="grid gap-4 sm:grid-cols-3">
              {visualMoments.map((item) => (
                <div key={item.src} className={`ambient-card overflow-hidden ${item.className}`}>
                  <div className="relative aspect-[4/4.1] overflow-hidden rounded-[1.4rem]">
                    <Image src={item.src} alt={item.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="image-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,26,22,0.26)] via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 rounded-full border border-white/35 bg-[rgba(21,30,26,0.36)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="soft-section section-block">
        <div className="section-shell">
          <SectionIntro
            align="center"
            kicker={t("about", "whyUs", lang)}
            title={
              lang === "tr"
                ? "Tedavi sürecini sağlık, konfor ve takip bütünlüğü içinde ele alıyoruz"
                : "We approach treatment as a complete balance of health, comfort, and follow-up"
            }
            subtitle={
              lang === "tr"
                ? "Hastalarımızın kendini güvende hissetmesi için muayene öncesinden kontrol randevusuna kadar düzenli bir süreç sunuyoruz."
                : "We offer a structured process from first consultation to follow-up visits so patients feel informed and secure."
            }
          />
        </div>
      </section>
    </>
  );
}
