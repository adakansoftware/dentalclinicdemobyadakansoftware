"use client";

import Image from "next/image";
import Link from "next/link";
import { useLang } from "@/context/LangContext";
import SectionIntro from "@/components/shared/SectionIntro";
import TrustStrip from "@/components/shared/TrustStrip";
import StatsCounter from "@/components/shared/StatsCounter";
import DoctorCard from "@/components/shared/DoctorCard";
import ReviewCard from "@/components/shared/ReviewCard";
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

export default function HomeClient({ settings, services, specialists, reviews }: Props) {
  const { lang } = useLang();

  const clinicName = lang === "tr" ? settings.clinicName : settings.clinicNameEn;
  const address = lang === "tr" ? settings.address : settings.addressEn;
  const hasValidMapEmbed = isValidGoogleMapsEmbedUrl(settings.mapEmbedUrl);
  const leadService = services[0];
  const visibleServices = services.slice(0, 3);
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
      title: lang === "tr" ? "Net tedavi planlaması" : "Clear treatment planning",
      text:
        lang === "tr"
          ? "Her tedavinin kapsamı, tahmini seans yapısı ve süreç içeriği ilk görüşmeden itibaren açık şekilde paylaşılır."
          : "Treatment scope, estimated session structure, and process details are shared clearly from the first visit.",
    },
    {
      title: lang === "tr" ? "Uzmanlık odaklı yaklaşım" : "Specialist-led care",
      text:
        lang === "tr"
          ? "Hekimlerimizin uzmanlık alanları ve ilgilendiği tedaviler düzenli bir yapıda sunulur."
          : "Each clinician's expertise and relevant treatment areas are presented in a structured way.",
    },
    {
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

  const stats = [
    { value: specialists.length, suffix: "+", label: lang === "tr" ? "Uzman Hekim" : "Specialists" },
    { value: services.length, suffix: "+", label: lang === "tr" ? "Tedavi Alanı" : "Treatment Areas" },
    { value: reviews.filter((review) => review.isApproved && review.isVisible).length, suffix: "+", label: lang === "tr" ? "Hasta Yorumu" : "Patient Reviews" },
  ];

  return (
    <>
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
              <Link href="/appointment" className="btn-primary">
                {lang === "tr" ? "Online Randevu Al" : "Book Appointment"}
              </Link>
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
              <Link href="/services" className="btn-outline border-white/25 bg-white/10 text-white hover:border-white/40 hover:bg-white/18">
                {lang === "tr" ? "Hizmetleri İncele" : "Explore Treatments"}
              </Link>
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

      <TrustStrip items={trustStrip} />

      <section className="footer-band">
        <div className="section-shell grid gap-8 py-14 sm:grid-cols-3 md:py-16">
          {stats.map((stat) => (
            <StatsCounter key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} />
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-shell">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionIntro
                kicker={lang === "tr" ? "Neden Biz" : "Why Us"}
                title={lang === "tr" ? "Muayeneden tedavi planına kadar güven veren bir hasta yolculuğu" : "A reassuring patient journey from examination to treatment planning"}
                subtitle={lang === "tr" ? "Kliniğimizi ilk kez ziyaret eden hastaların ihtiyaç duyduğu temel bilgiler tek bir düzenli akış içinde sunulur." : "Core information needed by first-time patients is presented in one clear and organized flow."}
              />
            </div>

            <div>
              {promises.map((item, index) => (
                <article key={item.title} className="border-t border-[color:var(--border)] py-7 first:border-t-0 first:pt-0 md:py-8">
                  <div className="flex items-start gap-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[rgba(85,145,183,0.12)] text-sm font-bold text-[color:var(--accent-main)]">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold tracking-[-0.01em] text-[color:var(--text-primary)] md:text-2xl">{item.title}</h3>
                      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[color:var(--text-secondary)] md:text-base">{item.text}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
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
                <ReviewCard key={review.id} review={review} lang={lang} />
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
                <div className="grid h-[420px] place-items-center rounded-[1.4rem] bg-[color:var(--surface-muted)] text-center">
                  <div>
                    <div className="text-sm uppercase tracking-[0.2em] text-[color:var(--accent-main)]">
                      {lang === "tr" ? "Konum" : "Location"}
                    </div>
                    <div className="mt-3 max-w-sm text-base leading-relaxed text-[color:var(--text-secondary)]">
                      {address}
                    </div>
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
                <h2 className="text-3xl font-bold tracking-[-0.01em] text-[color:var(--text-primary)] md:text-4xl">
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
