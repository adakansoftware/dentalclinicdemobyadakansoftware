"use client";

import SectionIntro from "@/components/shared/SectionIntro";
import { isValidGoogleMapsEmbedUrl } from "@/lib/maps";
import type { SiteSettings } from "@/types";

interface Props {
  lang: "tr" | "en";
  settings: SiteSettings;
}

export default function ContactSection({ lang, settings }: Props) {
  const address = lang === "tr" ? settings.address : settings.addressEn;
  const hasValidMapEmbed = isValidGoogleMapsEmbedUrl(settings.mapEmbedUrl);
  const whatsappHref = settings.whatsapp ? `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}` : null;

  const contactCards = [
    { label: lang === "tr" ? "Telefon" : "Phone", value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, "")}` },
    { label: "E-posta", value: settings.email, href: `mailto:${settings.email}` },
    { label: lang === "tr" ? "Adres" : "Address", value: address },
    settings.whatsapp
      ? {
          label: "WhatsApp",
          value: settings.whatsapp,
          href: whatsappHref ?? undefined,
          external: true,
        }
      : null,
  ].filter(Boolean) as { label: string; value: string; href?: string; external?: boolean }[];

  return (
    <section className="section-block">
      <div className="section-shell">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <SectionIntro
              kicker={lang === "tr" ? "İletişim" : "Contact"}
              title={lang === "tr" ? "Randevu, bilgi alma ve ulaşım için tüm iletişim yollarımız burada" : "All clinic contact channels for appointments, information, and directions"}
              subtitle={lang === "tr" ? "Telefon, e-posta, WhatsApp ve konum bilgileri ile bize kolayca ulaşabilirsiniz." : "Reach us easily through phone, email, WhatsApp, and clinic location details."}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {contactCards.map((item) => {
                const content = (
                  <div className="card h-full p-6">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">
                      {item.label}
                    </div>
                    <div className="mt-4 text-base leading-relaxed text-[color:var(--text-primary)]">{item.value}</div>
                  </div>
                );

                return item.href ? (
                  <a key={item.label} href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noopener noreferrer" : undefined}>
                    {content}
                  </a>
                ) : (
                  <div key={item.label}>{content}</div>
                );
              })}
            </div>
          </div>

          <div className="editorial-panel overflow-hidden p-3">
            {settings.mapEmbedUrl && hasValidMapEmbed ? (
              <iframe src={settings.mapEmbedUrl} className="h-[420px] w-full rounded-[1.4rem]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Clinic map" />
            ) : (
              <div className="grid h-[420px] place-items-center rounded-[1.4rem] bg-[color:var(--surface-muted)] text-center">
                <div>
                  <div className="text-sm uppercase tracking-[0.2em] text-[color:var(--accent-main)]">
                    {lang === "tr" ? "Konum" : "Location"}
                  </div>
                  <div className="mt-3 max-w-sm text-base leading-relaxed text-[color:var(--text-secondary)]">
                    {address}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
