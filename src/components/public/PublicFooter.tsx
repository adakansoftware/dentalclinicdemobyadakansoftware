"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import type { SiteSettings } from "@/types";

interface Props { settings: SiteSettings; }

export default function PublicFooter({ settings }: Props) {
  const { lang } = useLang();
  const clinicName = lang === "tr" ? settings.clinicName : settings.clinicNameEn;
  const address = lang === "tr" ? settings.address : settings.addressEn;

  const navLinks = [
    { href: "/about", label: t("nav", "about", lang) },
    { href: "/services", label: t("nav", "services", lang) },
    { href: "/specialists", label: t("nav", "specialists", lang) },
    { href: "/faq", label: t("nav", "faq", lang) },
    { href: "/contact", label: t("nav", "contact", lang) },
    { href: "/appointment", label: t("nav", "appointment", lang) },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-xl mb-4">
              <span className="text-2xl">🦷</span>
              <span>{clinicName}</span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">{address}</p>
            <div className="mt-4 space-y-1 text-sm">
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-white transition-colors">
                📞 {settings.phone}
              </a>
              <a href={`mailto:${settings.email}`} className="flex items-center gap-2 hover:text-white transition-colors">
                ✉️ {settings.email}
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t("footer", "quickLinks", lang)}</h3>
            <ul className="space-y-2">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t("footer", "followUs", lang)}</h3>
            <div className="flex gap-3 flex-wrap">
              {settings.instagram && (
                <a href={settings.instagram} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                  Instagram
                </a>
              )}
              {settings.facebook && (
                <a href={settings.facebook} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                  Facebook
                </a>
              )}
              {settings.twitter && (
                <a href={settings.twitter} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                  Twitter/X
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} {clinicName}. {t("footer", "rights", lang)}
          <span className="mx-2">·</span>
          <a href="https://www.instagram.com/adakansoftware" target="_blank" rel="noopener noreferrer"
            className="text-gray-500 hover:text-white transition-colors">
            Adakan Software tarafından yapılmıştır
          </a>
        </div>
      </div>
    </footer>
  );
}
