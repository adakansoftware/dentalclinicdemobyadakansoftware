"use client";

import Image from "next/image";
import LocaleLink from "@/components/shared/LocaleLink";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import type { SiteSettings } from "@/types";

interface Props {
  settings: SiteSettings;
}

export default function PublicFooter({ settings }: Props) {
  const { lang } = useLang();
  const clinicName = lang === "tr" ? settings.clinicName : settings.clinicNameEn;
  const address = lang === "tr" ? settings.address : settings.addressEn;

  const navLinks = [
    { href: "/about", label: t("nav", "about", lang) },
    { href: "/services", label: t("nav", "services", lang) },
    { href: "/specialists", label: t("nav", "specialists", lang) },
    { href: "/reviews", label: t("nav", "reviews", lang) },
    { href: "/contact", label: t("nav", "contact", lang) },
  ];

  const socials = [
    settings.instagram ? { href: settings.instagram, label: "Instagram" } : null,
    settings.facebook ? { href: settings.facebook, label: "Facebook" } : null,
    settings.twitter ? { href: settings.twitter, label: "X" } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <footer className="footer-band">
      <div className="section-shell py-14 md:py-20">
        <div className="mb-12 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8db4cd]">
              {lang === "tr" ? "Planlı iletişim" : "Planned contact"}
            </div>
            <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-[-0.01em] text-white md:text-[2rem]">
              {lang === "tr"
                ? "Tedaviye dair ilk sorularınız için sakin ve net bir iletişim alanı"
                : "A calm and clear contact space for your first treatment questions"}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <LocaleLink href="/appointment" className="btn-primary">
              {lang === "tr" ? "Online Randevu Al" : "Book Appointment"}
            </LocaleLink>
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center justify-center rounded-xl border border-[rgba(232,241,247,0.28)] px-6 py-3 text-sm font-bold text-[#e8f1f7] transition-colors hover:border-[rgba(232,241,247,0.5)]"
            >
              {settings.phone}
            </a>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div className="max-w-md">
            <div className="mb-5 flex items-center gap-3">
              {settings.logoUrl ? (
                <Image
                  src={settings.logoUrl}
                  alt={clinicName}
                  width={44}
                  height={44}
                  sizes="44px"
                  className="h-11 w-auto rounded-xl object-contain"
                  unoptimized={settings.logoUrl.startsWith("data:")}
                />
              ) : (
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-sm font-bold text-white">AD</div>
              )}
              <div className="text-lg font-bold tracking-[-0.01em] text-white">{clinicName}</div>
            </div>

            <p className="text-sm leading-relaxed text-[rgba(232,241,247,0.72)]">
              {lang === "tr"
                ? "Sakin, açık ve güven veren bir klinik deneyimi sunmak için çalışıyoruz."
                : "We focus on a calm, clear, and reassuring clinical experience."}
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8db4cd]">
              {t("footer", "quickLinks", lang)}
            </h3>
            <div className="space-y-3 text-sm text-[rgba(232,241,247,0.72)]">
              {navLinks.map((link) => (
                <LocaleLink key={link.href} href={link.href} className="block transition-colors hover:text-white">
                  {link.label}
                </LocaleLink>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8db4cd]">
              {lang === "tr" ? "İletişim" : "Contact"}
            </h3>
            <div className="space-y-3 text-sm text-[rgba(232,241,247,0.72)]">
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="block transition-colors hover:text-white">
                {settings.phone}
              </a>
              <a href={`mailto:${settings.email}`} className="block break-all transition-colors hover:text-white">
                {settings.email}
              </a>
              <div>{address}</div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8db4cd]">
              {lang === "tr" ? "Sosyal" : "Social"}
            </h3>
            <div className="space-y-3 text-sm text-[rgba(232,241,247,0.72)]">
              {socials.length > 0 ? (
                socials.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block transition-colors hover:text-white"
                  >
                    {social.label}
                  </a>
                ))
              ) : (
                <div>{lang === "tr" ? "Yakında" : "Coming soon"}</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-[rgba(232,241,247,0.16)] pt-6 text-xs text-[rgba(232,241,247,0.6)] md:flex-row md:items-center md:justify-between">
          <div>
            &copy; {new Date().getFullYear()} {clinicName}. {t("footer", "rights", lang)}
          </div>
          <div>
            Design by{" "}
            <a
              href="https://www.adakansoftware.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white transition-colors hover:text-[#8db4cd]"
            >
              Adakan Software
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
