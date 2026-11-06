"use client";

import Image from "next/image";
import Link from "next/link";
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
        <Link href="/" className="flex min-w-0 items-center gap-3">
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
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-[rgba(85,145,183,0.12)] text-[color:var(--accent-main)]"
                    : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={phoneHref}
            className="hidden items-center gap-2 text-sm font-bold text-[color:var(--text-primary)] transition-colors hover:text-[color:var(--accent-main)] xl:inline-flex"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[rgba(85,145,183,0.12)] text-[color:var(--accent-main)]">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </span>
            {settings.phone}
          </a>

          <button
            onClick={toggleLang}
            className="hidden rounded-full border border-[color:var(--border-strong)] bg-white px-3 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)] sm:inline-flex"
          >
            {lang === "tr" ? "TR / EN" : "EN / TR"}
          </button>

          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden btn-ghost sm:inline-flex"
            >
              WhatsApp
            </a>
          ) : null}

          <Link href="/appointment" className="hidden btn-primary sm:inline-flex">
            {lang === "tr" ? "Online Randevu Al" : "Book Appointment"}
          </Link>

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
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block rounded-xl px-4 py-3 text-sm font-semibold ${
                    active
                      ? "bg-[rgba(85,145,183,0.12)] text-[color:var(--accent-main)]"
                      : "text-[color:var(--text-secondary)]"
                  }`}
                >
                  {link.label}
                </Link>
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
            <Link href="/appointment" className="btn-primary w-full">
              {lang === "tr" ? "Online Randevu Al" : "Book Appointment"}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
