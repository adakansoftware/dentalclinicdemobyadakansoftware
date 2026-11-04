"use client";

import { useActionState, startTransition } from "react";
import { useLang } from "@/context/LangContext";
import SectionIntro from "@/components/shared/SectionIntro";
import { t } from "@/lib/translations";
import { isValidGoogleMapsEmbedUrl } from "@/lib/maps";
import { submitContactAction } from "@/actions/contact";
import SpamProtectionFields from "@/components/shared/SpamProtectionFields";
import PageHero from "@/components/shared/PageHero";
import type { ActionResult, SiteSettings, WorkingHourData } from "@/types";

interface Props {
  settings: SiteSettings;
  workingHours: WorkingHourData[];
}

const initialState: ActionResult = { success: false };

export default function ContactClient({ settings, workingHours }: Props) {
  const { lang } = useLang();
  const [state, formAction, isPending] = useActionState(submitContactAction, initialState);

  const address = lang === "tr" ? settings.address : settings.addressEn;
  const hasValidMapEmbed = isValidGoogleMapsEmbedUrl(settings.mapEmbedUrl);
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];
  const hoursMap: Record<number, WorkingHourData> = {};
  for (const workingHour of workingHours) hoursMap[workingHour.dayOfWeek] = workingHour;

  const days: Record<number, { tr: string; en: string }> = {
    0: { tr: "Pazar", en: "Sunday" },
    1: { tr: "Pazartesi", en: "Monday" },
    2: { tr: "Salı", en: "Tuesday" },
    3: { tr: "Çarşamba", en: "Wednesday" },
    4: { tr: "Perşembe", en: "Thursday" },
    5: { tr: "Cuma", en: "Friday" },
    6: { tr: "Cumartesi", en: "Saturday" },
  };

  const trustPoints = [
    {
      title: lang === "tr" ? "Hızlı geri dönüş" : "Prompt response",
      text:
        lang === "tr"
          ? "Mesajlarınız ilgili birime düzenli şekilde ulaşır ve en kısa sürede geri dönüş planlanır."
          : "Your message is routed to the relevant team and a timely response is planned.",
    },
    {
      title: lang === "tr" ? "Doğru yönlendirme" : "Correct routing",
      text:
        lang === "tr"
          ? "Randevu talebi, tedavi sorusu veya genel bilgi ihtiyacı daha doğru şekilde ayrılır."
          : "Appointment requests, treatment questions, and general information needs are separated correctly.",
    },
    {
      title: lang === "tr" ? "Kolay ulaşım" : "Easy access",
      text:
        lang === "tr"
          ? "Telefon, e-posta ve WhatsApp üzerinden kliniğimize size en uygun kanaldan ulaşabilirsiniz."
          : "You can reach the clinic through phone, email, or WhatsApp using the channel that suits you best.",
    },
  ];

  return (
    <>
      <PageHero
        kicker={lang === "tr" ? "İletişim" : "Contact"}
        title={t("contact", "title", lang)}
        subtitle={t("contact", "subtitle", lang)}
        minimal
      >
        <div className="hero-panel hero-panel--compact p-6">
          <div className="space-y-3 text-sm">
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="block font-semibold text-[color:var(--text-primary)] transition-colors hover:text-[color:var(--accent-main)]">
              {settings.phone}
            </a>
            <a href={`mailto:${settings.email}`} className="block break-all text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]">
              {settings.email}
            </a>
          </div>
        </div>
      </PageHero>

      <section className="section-block">
        <div className="section-shell">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="editorial-panel p-8 md:p-10">
              <SectionIntro
                title={lang === "tr" ? "Ekibimizle doğrudan iletişime geçin" : "Contact our team directly"}
                subtitle={
                  lang === "tr"
                    ? "Tedavi öncesi bilgi almak, muayene randevusu planlamak veya süreç hakkında soru sormak için formu doldurabilirsiniz."
                    : "Use the form to request treatment information, plan an examination, or ask questions about your care process."
                }
              />

              {state.success ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-6 py-8 text-center text-green-800">
                  {t("contact", "success", lang)}
                </div>
              ) : (
                <form
                  action={(formData) => {
                    startTransition(() => {
                      void formAction(formData);
                    });
                  }}
                  className="space-y-4"
                >
                  <SpamProtectionFields />

                  {state.error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="form-label">{t("contact", "name", lang)} *</label>
                      <input name="name" className="form-input" required />
                    </div>
                    <div>
                      <label className="form-label">{t("contact", "phone", lang)} *</label>
                      <input name="phone" type="tel" className="form-input" required />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">{t("contact", "email", lang)}</label>
                    <input name="email" type="email" className="form-input" />
                  </div>

                  <div>
                    <label className="form-label">{t("contact", "subject", lang)} *</label>
                    <input name="subject" className="form-input" required />
                  </div>

                  <div>
                    <label className="form-label">{t("contact", "message", lang)} *</label>
                    <textarea name="message" className="form-input min-h-[160px]" required />
                  </div>

                  <button type="submit" disabled={isPending} className="btn-primary w-full md:w-auto">
                    {isPending ? t("common", "loading", lang) : t("contact", "send", lang)}
                  </button>
                </form>
              )}

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {trustPoints.map((item) => (
                  <div key={item.title} className="rounded-[1.4rem] border border-[rgba(207,216,211,0.84)] bg-[rgba(249,251,250,0.74)] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">{item.title}</div>
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--text-secondary)]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 lg:sticky lg:top-28">
              <div className="surface-panel p-6">
                <h3 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
                  {lang === "tr" ? "İletişim kanalları" : "Contact channels"}
                </h3>

                <div className="mt-5 space-y-3">
                  <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="contact-line">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">
                        {lang === "tr" ? "Telefon" : "Phone"}
                      </div>
                      <div className="mt-2 text-sm text-[color:var(--text-primary)]">{settings.phone}</div>
                    </div>
                  </a>
                  <a href={`mailto:${settings.email}`} className="contact-line">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">E-posta</div>
                      <div className="mt-2 break-all text-sm text-[color:var(--text-primary)]">{settings.email}</div>
                    </div>
                  </a>
                  <div className="contact-line">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">
                        {t("contact", "address", lang)}
                      </div>
                      <div className="mt-2 text-sm leading-relaxed text-[color:var(--text-primary)]">{address}</div>
                    </div>
                  </div>
                  {settings.whatsapp ? (
                    <a
                      href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-line"
                    >
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">WhatsApp</div>
                        <div className="mt-2 text-sm text-[color:var(--text-primary)]">{settings.whatsapp}</div>
                      </div>
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="surface-panel p-6">
                <h3 className="mb-4 text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">{t("contact", "workingHours", lang)}</h3>
                <div className="space-y-2.5">
                  {dayOrder.map((day) => {
                    const workingHour = hoursMap[day];
                    const dayName = days[day]?.[lang] ?? "";

                    return (
                      <div key={day} className="summary-row">
                        <span className="font-medium text-[color:var(--text-secondary)]">{dayName}</span>
                        {workingHour && workingHour.isOpen ? (
                          <span className="font-semibold text-[color:var(--text-primary)]">
                            {workingHour.startTime} - {workingHour.endTime}
                          </span>
                        ) : (
                          <span className="text-[color:var(--accent-main)]">{t("contact", "closed", lang)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {settings.mapEmbedUrl && hasValidMapEmbed ? (
                <div className="editorial-panel overflow-hidden p-3">
                  <iframe
                    src={settings.mapEmbedUrl}
                    className="h-72 w-full rounded-[1.35rem]"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Location"
                  />
                </div>
              ) : (
                <div className="editorial-panel overflow-hidden p-6">
                  <div className="grid h-72 place-items-center rounded-[1.35rem] bg-[rgba(227,235,230,0.86)] text-center">
                    <div>
                      <div className="text-sm uppercase tracking-[0.2em] text-[color:var(--accent-main)]">
                        {lang === "tr" ? "Konum" : "Location"}
                      </div>
                      <div className="mt-3 max-w-sm text-base leading-relaxed text-[color:var(--text-secondary)]">
                        {settings.mapEmbedUrl && !hasValidMapEmbed
                          ? lang === "tr"
                            ? "Müşteri konumu için geçerli Google Maps embed bağlantısı girildiğinde bu alanda harita gösterilecektir."
                            : "A live map will be shown here once a valid Google Maps embed link is added for the client location."
                          : address}
                      </div>
                      {settings.mapEmbedUrl && !hasValidMapEmbed ? (
                        <div className="mt-4 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-700">
                          {lang === "tr"
                            ? "Harita alanı korunmuştur. Geçerli müşteri konumu girildiğinde doğrudan aktif harita olarak görünecektir."
                            : "The map area is preserved. It will automatically render as a live map once a valid client location is entered."}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
