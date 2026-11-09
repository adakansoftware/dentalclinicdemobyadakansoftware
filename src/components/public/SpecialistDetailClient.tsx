"use client";

import Image from "next/image";
import LocaleLink from "@/components/shared/LocaleLink";
import { useLang } from "@/context/LangContext";
import SectionIntro from "@/components/shared/SectionIntro";
import PageHero from "@/components/shared/PageHero";

interface ServiceItem {
  id: string;
  nameTr: string;
  nameEn: string;
  slug: string;
}

interface SpecialistWithServices {
  id: string;
  slug: string;
  nameTr: string;
  nameEn: string;
  titleTr: string;
  titleEn: string;
  biographyTr: string;
  biographyEn: string;
  photoUrl: string;
  specialistServices: { service: ServiceItem }[];
}

interface Props {
  specialist: SpecialistWithServices;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function SpecialistDetailClient({ specialist: sp }: Props) {
  const { lang } = useLang();

  const name = lang === "tr" ? sp.nameTr : sp.nameEn;
  const title = lang === "tr" ? sp.titleTr : sp.titleEn;
  const bio = lang === "tr" ? sp.biographyTr : sp.biographyEn;
  const notes = [
    lang === "tr" ? "Tedavi yaklaşımı bireysel muayene ile şekillenir." : "Treatment approach is shaped through individual consultation.",
    lang === "tr" ? "Uzmanlık alanları ilgili hizmetlerle birlikte sunulur." : "Areas of expertise are presented together with related services.",
    lang === "tr" ? "Randevu ve ön bilgi talepleri için klinik iletişimi açıktır." : "Clinic communication remains open for booking and preliminary questions.",
  ];

  return (
    <>
      <PageHero kicker={lang === "tr" ? "Uzman Profil" : "Specialist Profile"} title={name} subtitle={title}>
        <div className="hero-panel p-3 md:p-4">
          <div className="media-frame">
            {sp.photoUrl ? (
              <Image
                src={sp.photoUrl}
                alt={name}
                width={1600}
                height={800}
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="h-[380px] w-full object-cover"
                unoptimized={sp.photoUrl.startsWith("data:")}
              />
            ) : (
              <div className="grid h-[380px] place-items-center text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-main)]">
                {getInitials(name)}
              </div>
            )}
          </div>
        </div>
      </PageHero>

      <section className="section-block">
        <div className="section-shell">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.06fr)_minmax(19rem,0.94fr)]">
            <div className="space-y-8">
              <div className="editorial-panel p-8 md:p-10">
                <SectionIntro title={lang === "tr" ? `${name} hakkında genel bilgi` : `General information about ${name}`} />
                <p className="whitespace-pre-line text-base leading-relaxed text-[color:var(--text-secondary)] md:text-lg">{bio}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {notes.map((note, index) => (
                  <div key={note} className="card p-6">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">
                      {`0${index + 1}`}
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-[color:var(--text-secondary)]">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 lg:sticky lg:top-28">
              {sp.specialistServices.length > 0 ? (
                <div className="surface-panel p-6">
                  <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">
                    {lang === "tr" ? "İlgili Hizmetler" : "Related Services"}
                  </div>
                  <div className="space-y-3">
                    {sp.specialistServices.map(({ service }) => (
                      <LocaleLink key={service.id} href={`/services/${service.slug}`} className="contact-line">
                        <div className="font-medium text-[color:var(--text-primary)]">{lang === "tr" ? service.nameTr : service.nameEn}</div>
                      </LocaleLink>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="editorial-panel p-6">
                <h3 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
                  {lang === "tr"
                    ? "Randevu ya da ön bilgi için kliniğimizle iletişime geçebilirsiniz"
                    : "Contact the clinic for an appointment or preliminary information"}
                </h3>
                <div className="mt-6 flex flex-wrap gap-3">
                  <LocaleLink href={`/appointment?specialist=${sp.id}`} className="btn-primary">
                    {lang === "tr" ? "Online Randevu" : "Book Appointment"}
                  </LocaleLink>
                  <LocaleLink href="/contact" className="btn-ghost">
                    {lang === "tr" ? "İletişim" : "Contact"}
                  </LocaleLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
