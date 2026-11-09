"use client";

import TrustStrip from "@/components/shared/TrustStrip";
import StatsCounter from "@/components/shared/StatsCounter";
import type { ReviewData, ServiceData, SpecialistData } from "@/types";

interface Props {
  lang: "tr" | "en";
  services: ServiceData[];
  specialists: SpecialistData[];
  reviews: ReviewData[];
}

export default function StatsBand({ lang, services, specialists, reviews }: Props) {
  const trustStrip = [
    lang === "tr" ? "Steril klinik ortamı" : "Sterile clinical environment",
    lang === "tr" ? "Uzman hekim kadrosu" : "Specialist team",
    lang === "tr" ? "Hızlı iletişim" : "Responsive communication",
    lang === "tr" ? "Şeffaf bilgilendirme" : "Transparent guidance",
  ];

  const stats = [
    { value: specialists.length, suffix: "+", label: lang === "tr" ? "Uzman Hekim" : "Specialists" },
    { value: services.length, suffix: "+", label: lang === "tr" ? "Tedavi Alanı" : "Treatment Areas" },
    { value: reviews.filter((review) => review.isApproved && review.isVisible).length, suffix: "+", label: lang === "tr" ? "Hasta Yorumu" : "Patient Reviews" },
  ];

  return (
    <>
      <TrustStrip items={trustStrip} />

      <section className="footer-band">
        <div className="section-shell grid gap-8 py-14 sm:grid-cols-3 md:py-16">
          {stats.map((stat) => (
            <StatsCounter key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} />
          ))}
        </div>
      </section>
    </>
  );
}
