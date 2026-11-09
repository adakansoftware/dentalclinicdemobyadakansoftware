"use client";

import { useLang } from "@/context/LangContext";
import HeroSection from "@/components/public/home/HeroSection";
import StatsBand from "@/components/public/home/StatsBand";
import WhyUsSection from "@/components/public/home/WhyUsSection";
import ServicesSection from "@/components/public/home/ServicesSection";
import SpecialistsSection from "@/components/public/home/SpecialistsSection";
import ReviewsSection from "@/components/public/home/ReviewsSection";
import ContactSection from "@/components/public/home/ContactSection";
import FinalCta from "@/components/public/home/FinalCta";
import type { ReviewData, ServiceData, SiteSettings, SpecialistData } from "@/types";

interface Props {
  settings: SiteSettings;
  services: ServiceData[];
  specialists: SpecialistData[];
  reviews: ReviewData[];
}

export default function HomeClient({ settings, services, specialists, reviews }: Props) {
  const { lang } = useLang();

  return (
    <>
      <HeroSection lang={lang} settings={settings} />
      <StatsBand lang={lang} services={services} specialists={specialists} reviews={reviews} />
      <WhyUsSection lang={lang} />
      <ServicesSection lang={lang} services={services} />
      <SpecialistsSection lang={lang} specialists={specialists} />
      <ReviewsSection lang={lang} reviews={reviews} />
      <ContactSection lang={lang} settings={settings} />
      <FinalCta lang={lang} />
    </>
  );
}
