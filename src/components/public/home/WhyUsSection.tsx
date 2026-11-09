"use client";

import Image from "next/image";
import LocaleLink from "@/components/shared/LocaleLink";
import SectionIntro from "@/components/shared/SectionIntro";

const VISUALS = {
  clinicChair: "/images/editorial/clinic-interior.jpg",
  doctorMale: "/images/editorial/doctor-male.jpg",
  doctorFemale: "/images/editorial/doctor-female.jpg",
} as const;

interface Props {
  lang: "tr" | "en";
}

export default function WhyUsSection({ lang }: Props) {
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

  return (
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
                  <LocaleLink href="/about" className="btn-ghost">
                    {lang === "tr" ? "Kliniği Tanıyın" : "Meet the Clinic"}
                  </LocaleLink>
                  <LocaleLink href="/specialists" className="btn-outline">
                    {lang === "tr" ? "Uzmanları İnceleyin" : "View Specialists"}
                  </LocaleLink>
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
  );
}
