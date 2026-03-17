"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import type { SiteSettings, ServiceData, SpecialistData, ReviewData } from "@/types";

interface Props {
  settings: SiteSettings;
  services: ServiceData[];
  specialists: SpecialistData[];
  reviews: ReviewData[];
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={s <= stars ? "text-yellow-400" : "text-gray-200"}>★</span>
      ))}
    </div>
  );
}

export default function HomeClient({ settings, services, specialists, reviews }: Props) {
  const { lang } = useLang();

  const heroTitle = lang === "tr" ? settings.heroTitleTr : settings.heroTitleEn;
  const heroSubtitle = lang === "tr" ? settings.heroSubtitleTr : settings.heroSubtitleEn;

  return (
    <>
      {/* HERO */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #145470) 100%)` }}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            🦷 {lang === "tr" ? settings.clinicName : settings.clinicNameEn}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-3xl mx-auto">
            {heroTitle}
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            {heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/appointment" className="btn-accent text-base px-8 py-4 rounded-xl font-bold shadow-lg">
              {t("home", "ctaButton", lang)}
            </Link>
            <Link href="/services" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-200">
              {t("home", "viewAll", lang)} →
            </Link>
          </div>
          {/* Trust badges */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto">
            {[
              { icon: "✓", label: lang === "tr" ? "10+ Yıl" : "10+ Years" },
              { icon: "★", label: lang === "tr" ? "500+ Hasta" : "500+ Patients" },
              { icon: "🏆", label: lang === "tr" ? "Uzman Ekip" : "Expert Team" },
            ].map((b) => (
              <div key={b.label} className="text-center">
                <div className="text-2xl mb-1">{b.icon}</div>
                <div className="text-sm font-semibold text-white/80">{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">{t("home", "servicesTitle", lang)}</h2>
            <p className="section-subtitle">{t("home", "servicesSubtitle", lang)}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc) => (
              <Link key={svc.id} href={`/services/${svc.slug}`} className="card p-6 group">
                <div className="text-4xl mb-4">🦷</div>
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-primary transition-colors" style={{ color: undefined }}>
                  {lang === "tr" ? svc.nameTr : svc.nameEn}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {lang === "tr" ? svc.shortDescTr : svc.shortDescEn}
                </p>
                <span className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                  {t("home", "learnMore", lang)} →
                </span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/services" className="btn-outline">
              {t("home", "viewAll", lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* SPECIALISTS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">{t("home", "specialistsTitle", lang)}</h2>
            <p className="section-subtitle">{t("home", "specialistsSubtitle", lang)}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {specialists.map((sp) => (
              <Link key={sp.id} href={`/specialists/${sp.slug}`} className="card overflow-hidden group text-center">
                <div className="h-48 flex items-center justify-center" style={{ background: "var(--color-primary-light)" }}>
                  {sp.photoUrl ? (
                    <img src={sp.photoUrl} alt={sp.nameTr} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-6xl">👨‍⚕️</div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">
                    {lang === "tr" ? sp.nameTr : sp.nameEn}
                  </h3>
                  <p className="text-sm font-medium mb-4" style={{ color: "var(--color-primary)" }}>
                    {lang === "tr" ? sp.titleTr : sp.titleEn}
                  </p>
                  <span className="btn-outline text-sm px-4 py-2">
                    {t("specialists", "bookWith", lang)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/specialists" className="btn-outline">
              {t("home", "viewAll", lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      {reviews.length > 0 && (
        <section className="py-20" style={{ background: "var(--color-primary-light)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="section-title">{t("home", "reviewsTitle", lang)}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((r) => (
                <div key={r.id} className="card p-6">
                  <StarRating stars={r.ratingStars} />
                  <p className="text-gray-700 mt-3 leading-relaxed italic">
                    "{lang === "tr" ? r.contentTr : r.contentEn}"
                  </p>
                  <p className="mt-4 font-semibold text-gray-900 text-sm">{r.patientName}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/reviews" className="btn-primary">
                {t("home", "viewAll", lang)}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-gray-900 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("home", "ctaTitle", lang)}</h2>
          <p className="text-gray-400 text-lg mb-8">{t("home", "ctaSubtitle", lang)}</p>
          <Link href="/appointment" className="btn-accent text-base px-10 py-4 rounded-xl font-bold shadow-xl">
            {t("home", "ctaButton", lang)}
          </Link>
        </div>
      </section>
    </>
  );
}
