"use client";

import Image from "next/image";
import LocaleLink from "@/components/shared/LocaleLink";
import type { SiteSettings } from "@/types";

interface Props {
  lang: "tr" | "en";
  settings: SiteSettings;
}

export default function HeroSection({ lang, settings }: Props) {
  const clinicName = lang === "tr" ? settings.clinicName : settings.clinicNameEn;
  const address = lang === "tr" ? settings.address : settings.addressEn;
  const whatsappHref = settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}` : null;

  const heroTitle = (lang === "tr" ? settings.heroTitleTr : settings.heroTitleEn) || (lang === "tr"
    ? "Sağlıklı, estetik ve güvenli gülüşler için modern diş kliniği"
    : "Modern dental care for healthy, aesthetic, and confident smiles");
  const heroSubtitle = (lang === "tr" ? settings.heroSubtitleTr : settings.heroSubtitleEn) || (lang === "tr"
    ? "Uzman kadro, dijital randevu deneyimi ve kişiye özel tedavi planlarıyla ağız ve diş sağlığınız için yanınızdayız."
    : "We support your oral health with a specialist team, digital booking experience, and treatment plans tailored to each patient.");

  return (
    <section className="relative min-h-[620px] overflow-hidden md:min-h-[76vh]">
      <div className="absolute inset-0">
        <Image src="/images/hero.jpg" alt={clinicName} fill priority sizes="100vw" className="image-cover" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,26,40,0.24)_0%,rgba(10,26,40,0.46)_55%,rgba(10,26,40,0.8)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,26,40,0.56)_0%,rgba(10,26,40,0.16)_55%,transparent_100%)]" />

      <div className="section-shell relative z-10 flex min-h-[620px] flex-col justify-end pb-14 pt-36 md:min-h-[76vh] md:pb-20">
        <div className="reveal-up max-w-3xl">
          <div className="section-kicker border-white/25 bg-white/10 text-white">
            {lang === "tr" ? "Adakan Dental Klinik" : "Adakan Dental Clinic"}
          </div>
          <h1 className="mt-5 text-[2.7rem] font-bold leading-[1.04] text-white md:text-[4.2rem]" style={{ letterSpacing: "-0.02em" }}>
            {heroTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            {heroSubtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <LocaleLink href="/appointment" className="btn-primary">
              {lang === "tr" ? "Online Randevu Al" : "Book Appointment"}
            </LocaleLink>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/18"
              >
                {lang === "tr" ? "WhatsApp'tan Yaz" : "Write on WhatsApp"}
              </a>
            ) : null}
            <LocaleLink href="/services" className="btn-outline border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/18">
              {lang === "tr" ? "Hizmetleri İncele" : "Explore Treatments"}
            </LocaleLink>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-white/75">
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="font-bold transition-colors hover:text-white">
              {settings.phone}
            </a>
            <span className="hidden h-1 w-1 rounded-full bg-white/40 sm:block" />
            <span>{address}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
