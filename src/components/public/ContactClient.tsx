"use client";

import { useActionState, startTransition } from "react";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import { submitContactAction } from "@/actions/contact";
import type { SiteSettings, WorkingHourData, ActionResult } from "@/types";

interface Props { settings: SiteSettings; workingHours: WorkingHourData[]; }

const initialState: ActionResult = { success: false };

export default function ContactClient({ settings, workingHours }: Props) {
  const { lang } = useLang();
  const [state, formAction, isPending] = useActionState(submitContactAction, initialState);

  const address = lang === "tr" ? settings.address : settings.addressEn;

  const dayOrder = [1, 2, 3, 4, 5, 6, 0];
  const hoursMap: Record<number, WorkingHourData> = {};
  for (const wh of workingHours) hoursMap[wh.dayOfWeek] = wh;

  const days: Record<number, { tr: string; en: string }> = {
    0: { tr: "Pazar", en: "Sunday" }, 1: { tr: "Pazartesi", en: "Monday" },
    2: { tr: "Salı", en: "Tuesday" }, 3: { tr: "Çarşamba", en: "Wednesday" },
    4: { tr: "Perşembe", en: "Thursday" }, 5: { tr: "Cuma", en: "Friday" },
    6: { tr: "Cumartesi", en: "Saturday" },
  };

  return (
    <>
      <div className="py-16 text-center text-white" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #145470))" }}>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("contact", "title", lang)}</h1>
        <p className="text-white/80 text-lg">{t("contact", "subtitle", lang)}</p>
      </div>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              {state.success ? (
                <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-8 rounded-xl text-center">
                  <div className="text-3xl mb-3">✓</div>
                  <p className="font-medium">{t("contact", "success", lang)}</p>
                </div>
              ) : (
                <form action={(fd) => { startTransition(() => { void formAction(fd); }); }} className="space-y-4">
                  {state.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{state.error}</div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <textarea name="message" className="form-input min-h-[120px]" required />
                  </div>
                  <button type="submit" disabled={isPending} className="btn-primary w-full">
                    {isPending ? t("common", "loading", lang) : t("contact", "send", lang)}
                  </button>
                </form>
              )}
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4">{t("contact", "address", lang)}</h3>
                <p className="text-gray-600 mb-3">{address}</p>
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-2 text-sm">📞 {settings.phone}</a>
                <a href={`mailto:${settings.email}`} className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-2 text-sm">✉️ {settings.email}</a>
                {settings.whatsapp && (
                  <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                    💬 WhatsApp
                  </a>
                )}
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-gray-900 mb-4">{t("contact", "workingHours", lang)}</h3>
                <div className="space-y-2">
                  {dayOrder.map((day) => {
                    const wh = hoursMap[day];
                    const name = days[day]?.[lang] ?? "";
                    return (
                      <div key={day} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 font-medium">{name}</span>
                        {wh && wh.isOpen
                          ? <span className="text-gray-900">{wh.startTime} - {wh.endTime}</span>
                          : <span className="text-red-500">{t("contact", "closed", lang)}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {settings.mapEmbedUrl && (
                <div className="card overflow-hidden">
                  <iframe src={settings.mapEmbedUrl} className="w-full h-48" loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade" title="Konum" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
