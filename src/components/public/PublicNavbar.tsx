"use client";

import Image from "next/image";
import LocaleLink from "@/components/shared/LocaleLink";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import type { SiteSettings } from "@/types";

interface Props {
  settings: SiteSettings;
  hoursLabel: string;
}

export default function PublicNavbar({ settings, hoursLabel }: Props) {
  const pathname = usePathname();
  const { lang, toggleLang } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavHidden, setMobileNavHidden] = useState(false);

  const clinicName = lang === "tr" ? settings.clinicName : settings.clinicNameEn;
  const address = lang === "tr" ? settings.address : settings.addressEn;
  const phoneHref = `tel:${settings.phone.replace(/\s/g, "")}`;
  const whatsappHref = settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}` : null;

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 12);

      if (window.innerWidth >= 1024 || open) {
        setMobileNavHidden(false);
      } else if (currentScrollY <= 24) {
        setMobileNavHidden(false);
      } else if (currentScrollY > lastScrollY + 8) {
        setMobileNavHidden(true);
      } else if (currentScrollY < lastScrollY - 8) {
        setMobileNavHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      setMobileNavHidden(false);
    }
  }, [open]);

  const infoItems = [
    { label: lang === "tr" ? "Telefon" : "Phone", value: settings.phone, href: phoneHref },
    { label: lang === "tr" ? "Konum" : "Location", value: address },
    { label: lang === "tr" ? "Çalışma Saatleri" : "Hours", value: hoursLabel || (lang === "tr" ? "Bilgi için iletişime geçin" : "Contact for details") },
  ];

  const links = [
    { href: "/about", label: t("nav", "about", lang) },
    { href: "/services", label: t("nav", "services", lang) },
    { href: "/specialists", label: t("nav", "specialists", lang) },
    { href: "/reviews", label: t("nav", "reviews", lang) },
    { href: "/faq", label: t("nav", "faq", lang) },
    { href: "/contact", label: t("nav", "contact", lang) },
  ];

  return (
    <header
      className={`sticky top-0 z-40 border-b border-[color:var(--border)] bg-[rgba(255,255,255,0.94)] backdrop-blur-md transition-all duration-300 ${
        scrolled ? "shadow-[0_10px_30px_rgba(16,38,56,0.08)]" : ""
      } ${mobileNavHidden ? "-translate-y-full lg:translate-y-0" : "translate-y-0"}`}
    >
      <nav className="section-shell flex min-h-[84px] items-center justify-between gap-6">
        <LocaleLink href="/" className="flex min-w-0 items-center gap-3">
          {settings.logoUrl ? (
            <Image
              src={settings.logoUrl}
              alt={clinicName}
              width={42}
              height={42}
              sizes="42px"
              className="h-10 w-auto rounded-xl object-contain"
              unoptimized={settings.logoUrl.startsWith("data:")}
            />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--cta-dark)] text-sm font-bold text-[color:var(--cta-light)]">
              AD
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-[1.05rem] font-bold tracking-[-0.01em] text-[color:var(--text-primary)]">
              {clinicName}
            </div>
          </div>
        </LocaleLink>

        <div className="hidden items-center gap-3 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <LocaleLink
                key={link.href}
                href={link.href}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[rgba(85,145,183,0.12)] text-[color:var(--accent-main)]"
                    : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                }`}
              >
                {link.label}
              </LocaleLink>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={phoneHref}
            className="hidden shrink-0 items-center gap-3 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold tracking-[0.01em] text-[color:var(--text-primary)] transition-colors hover:bg-[rgba(85,145,183,0.08)] hover:text-[color:var(--accent-main)] 2xl:inline-flex"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[rgba(85,145,183,0.12)] text-[color:var(--accent-main)]">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </span>
            {settings.phone}
          </a>

          <button
            onClick={toggleLang}
            className="hidden shrink-0 rounded-full border border-[color:var(--border-strong)] bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)] sm:inline-flex"
          >
            {lang === "tr" ? "TR / EN" : "EN / TR"}
          </button>

          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden btn-ghost xl:inline-flex"
              aria-label="WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4 text-[#25d366]">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 004.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.03h-.01a8.2 8.2 0 01-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.4-.12-.56.13-.17.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.12-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.22-.16-.47-.28z" />
              </svg>
            </a>
          ) : null}

          <LocaleLink href="/appointment" className="hidden shrink-0 btn-primary sm:inline-flex">
            {lang === "tr" ? "Randevu Al" : "Book Now"}
          </LocaleLink>

          <button
            className="rounded-xl border border-[color:var(--border-strong)] p-2.5 text-[color:var(--text-primary)] lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Menu"
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open ? (
        <div id="mobile-nav-panel" className="section-shell mb-4 rounded-2xl border border-[color:var(--border)] bg-white p-4 shadow-[var(--shadow-soft)] lg:hidden">
          <div className="mb-4 grid gap-3 rounded-xl bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-secondary)]">
            {infoItems.map((item) => (
              <div key={item.label}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">{item.label}</div>
                {item.href ? (
                  <a href={item.href} className="mt-1 block font-semibold text-[color:var(--text-primary)]">
                    {item.value}
                  </a>
                ) : (
                  <div className="mt-1 text-[color:var(--text-primary)]">{item.value}</div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {links.map((link) => {
              const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <LocaleLink
                  key={link.href}
                  href={link.href}
                  className={`block rounded-xl px-4 py-3 text-sm font-semibold ${
                    active
                      ? "bg-[rgba(85,145,183,0.12)] text-[color:var(--accent-main)]"
                      : "text-[color:var(--text-secondary)]"
                  }`}
                >
                  {link.label}
                </LocaleLink>
              );
            })}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button onClick={toggleLang} className="btn-ghost w-full">
              {lang === "tr" ? "English" : "Türkçe"}
            </button>
            {whatsappHref ? (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn-ghost w-full text-center">
                WhatsApp
              </a>
            ) : null}
            <LocaleLink href="/appointment" className="btn-primary w-full">
              {lang === "tr" ? "Online Randevu Al" : "Book Appointment"}
            </LocaleLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
