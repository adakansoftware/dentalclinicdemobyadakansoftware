"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/context/LangContext";
import SectionIntro from "@/components/shared/SectionIntro";
import { getServiceImage } from "@/lib/service-images";
import { isValidGoogleMapsEmbedUrl } from "@/lib/maps";
import { t } from "@/lib/translations";
import type { ReviewData, ServiceData, SiteSettings, SpecialistData } from "@/types";

interface Props {
  settings: SiteSettings;
  services: ServiceData[];
  specialists: SpecialistData[];
  reviews: ReviewData[];
}

const VISUALS = {
  clinicChair: "/images/editorial/clinic-interior.jpg",
  doctorMale: "/images/editorial/doctor-male.jpg",
  doctorFemale: "/images/editorial/doctor-female.jpg",
} as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function truncate(text: string, max = 170) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

function formatReviewDate(date: string, lang: "tr" | "en") {
  return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex gap-1 text-[13px] text-[color:var(--accent-main)]">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= stars ? "opacity-100" : "opacity-25"}>
          *
        </span>
      ))}
    </div>
  );
}

export default function HomeClient({ settings, services, specialists, reviews }: Props) {
  const { lang } = useLang();

  const clinicName = lang === "tr" ? settings.clinicName : settings.clinicNameEn;
  const address = lang === "tr" ? settings.address : settings.addressEn;
  const hasValidMapEmbed = isValidGoogleMapsEmbedUrl(settings.mapEmbedUrl);
  const leadService = services[0];
  const visibleServices = services.slice(0, 6);
  const visibleSpecialists = specialists.slice(0, 3);
  const visibleReviews = reviews.filter((review) => review.isApproved && review.isVisible).slice(0, 3);
  const whatsappHref = settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}` : null;

  const heroTitle = (lang === "tr" ? settings.heroTitleTr : settings.heroTitleEn) || (lang === "tr"
    ? "Sağlıklı, estetik ve güvenli gülüşler için modern diş kliniği"
    : "Modern dental care for healthy, aesthetic, and confident smiles");
  const heroSubtitle = (lang === "tr" ? settings.heroSubtitleTr : settings.heroSubtitleEn) || (lang === "tr"
    ? "Uzman kadro, dijital randevu deneyimi ve kişiye özel tedavi planlarıyla ağız ve diş sağlığınız için yanınızdayız."
    : "We support your oral health with a specialist team, digital booking experience, and treatment plans tailored to each patient.");

  const trustStrip = [
    lang === "tr" ? "Steril klinik ortamı" : "Sterile clinical environment",
    lang === "tr" ? "Uzman hekim kadrosu" : "Specialist team",
    lang === "tr" ? "Hızlı iletişim" : "Responsive communication",
    lang === "tr" ? "Şeffaf bilgilendirme" : "Transparent guidance",
  ];

  const promises = [
    {
      number: "01",
      title: lang === "tr" ? "Net tedavi planlaması" : "Clear treatment planning",
      text:
        lang === "tr"
          ? "Her tedavinin kapsamı, tahmini seans yapısı ve süreç içeriği ilk görüşmeden itibaren açık şekilde paylaşılır."
          : "Treatment scope, estimated session structure, and process details are shared clearly from the first visit.",
    },
    {
      number: "02",
      title: lang === "tr" ? "Uzmanlık odaklı yaklaşım" : "Specialist-led care",
      text:
        lang === "tr"
          ? "Hekimlerimizin uzmanlık alanları ve ilgilendiği tedaviler düzenli bir yapıda sunulur."
          : "Each clinician's expertise and relevant treatment areas are presented in a structured way.",
    },
    {
      number: "03",
      title: lang === "tr" ? "Kolay randevu ve iletişim" : "Accessible booking and contact",
      text:
        lang === "tr"
          ? "Telefon, WhatsApp ve online randevu kanalları sayesinde kliniğimize hızlı ve güvenli şekilde ulaşabilirsiniz."
          : "Phone, WhatsApp, and online booking channels make it easy to reach the clinic quickly and confidently.",
    },
  ];

  const contactCards = [
    { label: lang === "tr" ? "Telefon" : "Phone", value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, "")}` },
    { label: "E-posta", value: settings.email, href: `mailto:${settings.email}` },
    { label: lang === "tr" ? "Adres" : "Address", value: address },
    settings.whatsapp
      ? {
          label: "WhatsApp",
          value: settings.whatsapp,
          href: whatsappHref ?? undefined,
          external: true,
        }
      : null,
  ].filter(Boolean) as { label: string; value: string; href?: string; external?: boolean }[];

  return (
    <>
      <section className="page-hero">
        <div className="hero-orb hero-orb--one" />
        <div className="hero-orb hero-orb--two" />
        <div className="section-shell section-block relative z-10">
          <div
            className="relative overflow-hidden rounded-[2.4rem] border border-white/30 shadow-[0_32px_80px_rgba(28,24,20,0.16)]"
            style={{ minHeight: "540px" }}
          >
            <div className="absolute inset-0">
              <Image src="/images/hero.jpg" alt={clinicName} fill priority sizes="100vw" className="image-cover scale-[1.04]" />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,17,15,0.68)_0%,rgba(17,17,15,0.48)_32%,rgba(17,17,15,0.16)_58%,rgba(17,17,15,0.28)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[rgba(14,14,12,0.38)] to-transparent" />

            <div className="relative min-h-[540px] px-6 py-8 md:px-10 md:py-10 xl:px-14 xl:py-14">
              <div className="grid min-h-[460px] gap-10 xl:grid-cols-[1.12fr_0.88fr] xl:items-end">
                <div className="flex max-w-3xl flex-col justify-center">
                  <div className="reveal-up">
                    <div className="section-kicker border-white/20 bg-white/10 text-white">
                      {lang === "tr" ? "Adakan Dental Klinik" : "Adakan Dental Clinic"}
                    </div>
                    <h1 className="mt-5 text-[3.1rem] font-semibold leading-[0.98] text-white md:text-[5.1rem]" style={{ letterSpacing: "-0.075em" }}>
                      {heroTitle}
                    </h1>
                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
                      {heroSubtitle}
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <Link href="/appointment" className="btn-primary">
                        {lang === "tr" ? "Online Randevu Al" : "Book Appointment"}
                      </Link>
                      {whatsappHref ? (
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/18"
                        >
                          {lang === "tr" ? "WhatsApp'tan Yaz" : "Write on WhatsApp"}
                        </a>
                      ) : null}
                      <Link href="/services" className="btn-outline border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/18">
                        {lang === "tr" ? "Hizmetleri İncele" : "Explore Treatments"}
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-end xl:justify-center">
                  <div className="w-full max-w-[20rem] rounded-[1.5rem] border border-white/16 bg-[rgba(255,255,255,0.12)] p-5 backdrop-blur-md xl:mb-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                      {lang === "tr" ? "Klinik Bilgisi" : "Clinic Info"}
                    </div>
                    <div className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-white">{clinicName}</div>
                    <p className="mt-2 text-sm leading-relaxed text-white/78">{address}</p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="btn-outline border-white/14 bg-white/10 text-white hover:border-white/24 hover:bg-white/16">
                        {settings.phone}
                      </a>
                      <Link href="/contact" className="btn-outline border-white/14 bg-white/10 text-white hover:border-white/24 hover:bg-white/16">
                        {lang === "tr" ? "İletişim" : "Contact"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[rgba(217,210,200,0.72)] bg-[rgba(248,246,241,0.82)] py-6">
        <div className="section-shell">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {trustStrip.map((item, index) => (
              <div key={item} className={`proof-band reveal-up reveal-delay-${Math.min(index, 3)}`}>
                <span className="proof-band__index">{`0${index + 1}`}</span>
                <span className="proof-band__text">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="section-shell">
          <SectionIntro
            kicker={lang === "tr" ? "Neden Biz" : "Why Us"}
            title={lang === "tr" ? "Muayeneden tedavi planına kadar güven veren bir hasta yolculuğu" : "A reassuring patient journey from examination to treatment planning"}
            subtitle={lang === "tr" ? "Kliniğimizi ilk kez ziyaret eden hastaların ihtiyaç duyduğu temel bilgiler tek bir düzenli akış içinde sunulur." : "Core information needed by first-time patients is presented in one clear and organized flow."}
          />

          <div className="grid gap-6 md:grid-cols-3">
            {promises.map((item) => (
              <article key={item.title} className="card flex h-full flex-col p-7">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">{item.number}</div>
                <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">{item.title}</h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-[color:var(--text-secondary)] md:text-base">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="featured-split-card overflow-hidden">
              <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
                <div className="featured-split-card__media min-h-[320px]">
                  <Image src={VISUALS.clinicChair} alt={lang === "tr" ? "Klinik tedavi alanı" : "Clinic treatment visual"} fill sizes="(max-width: 1024px) 100vw, 42vw" className="image-cover" />
                  <div className="featured-split-card__overlay" />
                  <div className="featured-split-card__badge">{lang === "tr" ? "Klinik Deneyimi" : "Treatment Scene"}</div>
                </div>

                <div className="featured-split-card__content">
                  <div className="featured-split-card__meta">{lang === "tr" ? "Güven Veren Ortam" : "Clinical Experience"}</div>
                  <h3 className="featured-split-card__title">
                    {lang === "tr" ? "Klinik ortamını ve tedavi alanlarını önceden tanıma imkânı" : "A clearer preview of the clinic environment and treatment areas"}
                  </h3>
                  <p className="featured-split-card__body">
                    {lang === "tr" ? "Muayene odaları, tedavi alanları ve ekip yapısı hakkında güven veren ilk izlenimi güçlendiren görsel bir tanıtım alanı." : "A visual introduction area that helps patients understand the clinic rooms, treatment spaces, and team structure."}
                  </p>
                  <div className="featured-split-card__actions">
                    <Link href="/about" className="btn-ghost">
                      {lang === "tr" ? "Kliniği Tanıyın" : "Meet the Clinic"}
                    </Link>
                    <Link href="/specialists" className="btn-outline">
                      {lang === "tr" ? "Uzmanları İnceleyin" : "View Specialists"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <div className="stack-card overflow-hidden p-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.2rem]">
                  <Image src={VISUALS.doctorMale} alt={lang === "tr" ? "Uzman hekim portresi" : "Specialist portrait"} fill sizes="(max-width: 1024px) 100vw, 24vw" className="image-cover" />
                </div>
                <div className="px-2 pb-2 pt-4">
                  <div className="stack-card__meta">{lang === "tr" ? "Uzman Hekim" : "Doctor Profile"}</div>
                  <h3 className="stack-card__title">{lang === "tr" ? "Uzman hekim kadromuzu daha yakından tanıyın" : "Get to know the clinical team more closely"}</h3>
                </div>
              </div>

              <div className="stack-card overflow-hidden p-3">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.2rem]">
                  <Image src={VISUALS.doctorFemale} alt={lang === "tr" ? "Klinik uygulama görseli" : "Clinical application visual"} fill sizes="(max-width: 1024px) 100vw, 24vw" className="image-cover" />
                </div>
                <div className="px-2 pb-2 pt-4">
                  <div className="stack-card__meta">{lang === "tr" ? "Tedavi Detayı" : "Detail Layer"}</div>
                  <h3 className="stack-card__title">{lang === "tr" ? "Tedavi süreçlerine dair daha net bir ilk bakış" : "A clearer first look at treatment procedures"}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="soft-section section-block">
        <div className="section-shell">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionIntro
              kicker={lang === "tr" ? "Hizmetler" : "Services"}
              title={lang === "tr" ? "Size uygun tedaviyi daha rahat seçebilmeniz için hizmetlerimizi inceleyin" : "Review our treatments to choose the care that fits your needs"}
              subtitle={lang === "tr" ? "Her hizmet kartında uygulamanın kısa özeti, ortalama süre ve randevu yönlendirmesi birlikte yer alır." : "Each treatment card includes a short overview, estimated duration, and a direct booking path."}
            />
            <Link href="/services" className="btn-ghost w-fit">
              {lang === "tr" ? "Tüm Hizmetler" : "All Services"}
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleServices.map((service) => (
              <article key={service.id} className="card flex h-full flex-col overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden bg-[color:var(--surface-muted)]">
                  <Image src={service.imageUrl || getServiceImage(service.slug)} alt={lang === "tr" ? service.nameTr : service.nameEn} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="image-cover transition-transform duration-500 hover:scale-[1.02]" />
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="service-chip w-fit">
                    {service.durationMinutes} {t("services", "minutes", lang)}
                  </div>
                  <h3 className="mt-4 text-[1.65rem] font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">
                    {lang === "tr" ? service.nameTr : service.nameEn}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-[color:var(--text-secondary)] md:text-base">
                    {lang === "tr" ? service.shortDescTr : service.shortDescEn}
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

          {leadService ? (
            <div className="mt-10 rounded-[2rem] border border-[rgba(217,210,200,0.9)] bg-[rgba(251,250,247,0.92)] p-6 md:p-8">
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div>
                  <h3 className="text-3xl font-semibold tracking-[-0.05em] text-[color:var(--text-primary)]">
                    {lang === "tr" ? leadService.nameTr : leadService.nameEn}
                  </h3>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--text-secondary)]">
                    {lang === "tr" ? leadService.shortDescTr : leadService.shortDescEn}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 lg:justify-end">
                  <Link href={`/services/${leadService.slug}`} className="btn-ghost">
                    {lang === "tr" ? "Tedavi Detayları" : "Treatment Details"}
                  </Link>
                  <Link href={`/appointment?service=${leadService.id}`} className="btn-primary">
                    {lang === "tr" ? "Online Randevu Al" : "Book Appointment"}
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section-block">
        <div className="section-shell">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionIntro
              kicker={lang === "tr" ? "Uzman Kadro" : "Specialists"}
              title={lang === "tr" ? "Tedavi sürecinizde size eşlik edecek hekimleri tanıyın" : "Meet the clinicians who will support your treatment journey"}
              subtitle={lang === "tr" ? "Hekimlerimizin uzmanlık alanları, deneyimi ve ilgi duyduğu tedaviler tek bakışta görülebilir." : "Each profile shows expertise, experience, and relevant treatment areas at a glance."}
            />
            <Link href="/specialists" className="btn-ghost w-fit">
              {lang === "tr" ? "Tüm Uzmanlar" : "All Specialists"}
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleSpecialists.map((specialist) => {
              const bio = lang === "tr" ? specialist.biographyTr : specialist.biographyEn;

              return (
                <article key={specialist.id} className="card flex h-full flex-col overflow-hidden bg-[rgba(248,246,241,0.95)]">
                  <div className="relative aspect-[4/4.4] overflow-hidden bg-[color:var(--surface-muted)]">
                    {specialist.photoUrl ? (
                      <Image src={specialist.photoUrl} alt={lang === "tr" ? specialist.nameTr : specialist.nameEn} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="image-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-sm uppercase tracking-[0.2em] text-[color:var(--accent-main)]">Portrait</div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-[1.6rem] font-semibold tracking-[-0.04em] text-[color:var(--text-primary)]">
                      {lang === "tr" ? specialist.nameTr : specialist.nameEn}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-[color:var(--accent-main)]">
                      {lang === "tr" ? specialist.titleTr : specialist.titleEn}
                    </p>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-[color:var(--text-secondary)]">
                      {truncate(bio, 150)}
                    </p>
                    <div className="mt-6">
                      <Link href={`/specialists/${specialist.slug}`} className="btn-ghost">
                        {lang === "tr" ? "Profili İncele" : "View Profile"}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="soft-section section-block">
        <div className="section-shell">
          <SectionIntro
            kicker={lang === "tr" ? "Hasta Yorumları" : "Reviews"}
            title={lang === "tr" ? "Hastalarımızın klinik deneyimi hakkındaki geri bildirimleri" : "Feedback from patients about their clinical experience"}
            subtitle={lang === "tr" ? "Muayene, tedavi süreci ve klinik yaklaşımımız hakkındaki yorumları inceleyebilirsiniz." : "You can review comments about examinations, treatment care, and the overall clinic approach."}
          />

          {visibleReviews.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {visibleReviews.map((review) => (
                <article key={review.id} className="card flex h-full flex-col p-7">
                  <StarRating stars={review.ratingStars} />
                  <p className="mt-5 flex-1 text-base leading-relaxed text-[color:var(--text-secondary)]">
                    &quot;{lang === "tr" ? review.contentTr : review.contentEn}&quot;
                  </p>
                  <div className="mt-6 border-t border-[rgba(217,210,200,0.84)] pt-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-full bg-[rgba(239,233,225,0.9)] text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-main)]">
                        {getInitials(review.patientName)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--text-primary)]">{review.patientName}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[color:var(--accent-main)]">
                          {review.sourceLabel ? `${review.sourceLabel} / ` : ""}
                          {formatReviewDate(review.createdAt, lang)}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="surface-panel p-10 text-center text-sm leading-relaxed text-[color:var(--text-secondary)]">
              {lang === "tr" ? "Yorumlar burada sakin ve güven veren bir düzende yer alacak." : "Reviews will appear here in a calm, trust-building layout."}
            </div>
          )}
        </div>
      </section>

      <section className="section-block">
        <div className="section-shell">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <SectionIntro
                kicker={lang === "tr" ? "İletişim" : "Contact"}
                title={lang === "tr" ? "Randevu, bilgi alma ve ulaşım için tüm iletişim yollarımız burada" : "All clinic contact channels for appointments, information, and directions"}
                subtitle={lang === "tr" ? "Telefon, e-posta, WhatsApp ve konum bilgileri ile bize kolayca ulaşabilirsiniz." : "Reach us easily through phone, email, WhatsApp, and clinic location details."}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {contactCards.map((item) => {
                  const content = (
                    <div className="card h-full p-6">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">
                        {item.label}
                      </div>
                      <div className="mt-4 text-base leading-relaxed text-[color:var(--text-primary)]">{item.value}</div>
                    </div>
                  );

                  return item.href ? (
                    <a key={item.label} href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noopener noreferrer" : undefined}>
                      {content}
                    </a>
                  ) : (
                    <div key={item.label}>{content}</div>
                  );
                })}
              </div>
            </div>

            <div className="editorial-panel overflow-hidden p-3">
              {settings.mapEmbedUrl && hasValidMapEmbed ? (
                <iframe src={settings.mapEmbedUrl} className="h-[420px] w-full rounded-[1.4rem]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Clinic map" />
              ) : (
                <div className="grid h-[420px] place-items-center rounded-[1.4rem] bg-[rgba(239,233,225,0.86)] text-center">
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-[color:var(--accent-main)]">
                      {lang === "tr" ? "Konum" : "Location"}
                    </div>
                    <div className="mt-3 max-w-sm text-base leading-relaxed text-[color:var(--text-secondary)]">
                      {settings.mapEmbedUrl && !hasValidMapEmbed
                        ? lang === "tr"
                          ? "Geçerli bir Google Maps embed bağlantısı girildiğinde klinik konumu bu alanda gösterilecektir."
                          : "The clinic location will appear here once a valid Google Maps embed link is provided."
                        : address}
                    </div>
                    {settings.mapEmbedUrl && !hasValidMapEmbed ? (
                      <div className="mt-4 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-700">
                        {lang === "tr"
                          ? "Bu alan, müşteriye ait geçerli konum bağlantısı eklendiğinde otomatik olarak aktif haritaya dönüşecektir."
                          : "This area will automatically switch to a live map once a valid customer location link is added."}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-block pt-0">
        <div className="section-shell">
          <div className="quiet-cta-band px-7 py-8 md:px-10 md:py-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[color:var(--text-primary)] md:text-4xl">
                  {lang === "tr" ? "Muayenenizi planlamak için ilk adımı şimdi atın" : "Take the first step now to plan your dental visit"}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--text-secondary)]">
                  {lang === "tr" ? "Uygun hizmeti, hekimi ve tarihi seçerek online randevu talebinizi birkaç adımda iletebilirsiniz." : "Choose the right treatment, clinician, and date to send your appointment request in just a few steps."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link href="/appointment" className="btn-primary">
                  {lang === "tr" ? "Online Randevu Al" : "Book Appointment"}
                </Link>
                <Link href="/contact" className="btn-ghost">
                  {lang === "tr" ? "İletişim" : "Contact"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
