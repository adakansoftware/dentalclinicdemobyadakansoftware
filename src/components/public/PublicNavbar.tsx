"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import type { SiteSettings } from "@/types";

interface Props { settings: SiteSettings; }

export default function PublicNavbar({ settings }: Props) {
  const { lang, toggleLang } = useLang();
  const [open, setOpen] = useState(false);

  const clinicName = lang === "tr" ? settings.clinicName : settings.clinicNameEn;

  const links = [
    { href: "/about", label: t("nav", "about", lang) },
    { href: "/services", label: t("nav", "services", lang) },
    { href: "/specialists", label: t("nav", "specialists", lang) },
    { href: "/reviews", label: t("nav", "reviews", lang) },
    { href: "/faq", label: t("nav", "faq", lang) },
    { href: "/contact", label: t("nav", "contact", lang) },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl" style={{ color: "var(--color-primary)" }}>
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={clinicName} className="h-8 w-auto" />
          ) : (
            <span className="text-2xl">🦷</span>
          )}
          <span className="hidden sm:block">{clinicName}</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 text-sm font-semibold border-2 rounded-lg transition-colors"
            style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
          >
            {lang === "tr" ? "EN" : "TR"}
          </button>
          {settings.whatsapp && (
            <a
              href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
          <Link href="/appointment" className="hidden sm:block btn-primary text-sm px-4 py-2">
            {t("nav", "appointment", lang)}
          </Link>
          {/* Mobile menu toggle */}
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setOpen(!open)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
              {l.label}
            </Link>
          ))}
          <div className="pt-2 flex gap-2 flex-wrap">
            <button onClick={toggleLang} className="flex-1 py-2 text-sm font-semibold border-2 rounded-lg"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}>
              {lang === "tr" ? "EN" : "TR"}
            </button>
            {settings.whatsapp && (
              <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2 bg-green-500 text-white text-sm font-semibold rounded-lg text-center">
                💬 WhatsApp
              </a>
            )}
            <Link href="/appointment" onClick={() => setOpen(false)} className="w-full btn-primary text-sm py-2 text-center">
              {t("nav", "appointment", lang)}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
