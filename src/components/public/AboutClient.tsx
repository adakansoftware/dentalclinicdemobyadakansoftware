"use client";

import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import type { SiteSettings } from "@/types";

interface Props { settings: SiteSettings; }

export default function AboutClient({ settings }: Props) {
  const { lang } = useLang();

  const title = lang === "tr" ? settings.aboutTitleTr : settings.aboutTitleEn;
  const text = lang === "tr" ? settings.aboutTextTr : settings.aboutTextEn;
  const clinicName = lang === "tr" ? settings.clinicName : settings.clinicNameEn;

  const featureList = [
    {
      icon: "🏆",
      title: lang === "tr" ? "10+ Yıl Deneyim" : "10+ Years Experience",
      desc: lang === "tr" ? "Yılların verdiği deneyimle en iyi tedaviyi sunuyoruz." : "We offer the best treatment with years of experience.",
    },
    {
      icon: "🔬",
      title: lang === "tr" ? "Modern Teknoloji" : "Modern Technology",
      desc: lang === "tr" ? "Son teknoloji cihazlarla doğru teşhis ve tedavi." : "Accurate diagnosis and treatment with state-of-the-art equipment.",
    },
    {
      icon: "👨‍⚕️",
      title: lang === "tr" ? "Uzman Kadro" : "Expert Team",
      desc: lang === "tr" ? "Alanında uzman deneyimli hekimlerimiz." : "Our experienced specialist doctors.",
    },
    {
      icon: "💙",
      title: lang === "tr" ? "Hasta Konforu" : "Patient Comfort",
      desc: lang === "tr" ? "Steril ortam, rahat bekleme alanı, güler yüz." : "Sterile environment, comfortable waiting area, friendly staff.",
    },
  ];

  return (
    <>
      <div className="py-16 text-center text-white" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #145470))" }}>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
        <p className="text-white/80 text-lg">{clinicName}</p>
      </div>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-xl text-gray-700 leading-relaxed text-center">{text}</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center mb-12">{t("about", "whyUs", lang)}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureList.map((f) => (
              <div key={f.title} className="card p-6 text-center">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
