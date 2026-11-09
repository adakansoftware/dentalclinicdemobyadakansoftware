"use client";

import LocaleLink from "@/components/shared/LocaleLink";
import { useLang } from "@/context/LangContext";
import type { SiteSettings } from "@/types";

interface Props {
  settings: SiteSettings;
}

export default function ConversionDock({ settings }: Props) {
  const { lang } = useLang();
  const phoneHref = `tel:${settings.phone.replace(/\s/g, "")}`;
  const whatsappHref = settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}` : null;
  const helperText = lang === "tr" ? "Hızlı iletişim ve randevu" : "Quick contact and booking";

  return (
    <div className="conversion-dock">
      <div className="conversion-dock__inner">
        <div className="conversion-dock__meta">{helperText}</div>
        <a
          href={whatsappHref ?? phoneHref}
          className="conversion-dock__secondary"
          target={whatsappHref ? "_blank" : undefined}
          rel={whatsappHref ? "noopener noreferrer" : undefined}
        >
          {whatsappHref ? "WhatsApp" : lang === "tr" ? "Telefon" : "Call"}
        </a>
        <LocaleLink href="/appointment" className="conversion-dock__primary">
          {lang === "tr" ? "Online Randevu Al" : "Book Appointment"}
        </LocaleLink>
      </div>
    </div>
  );
}
