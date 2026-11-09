"use client";

import LocaleLink from "@/components/shared/LocaleLink";
import { useLang } from "@/context/LangContext";

export default function NotFoundClient() {
  const { lang } = useLang();

  const copy =
    lang === "en"
      ? {
          kicker: "404",
          title: "Page not found",
          body: "The page you are looking for may have been moved or no longer exists. You can return to the home page or book an appointment directly.",
          home: "Back to home",
          appointment: "Book an appointment",
        }
      : {
          kicker: "404",
          title: "Sayfa bulunamadı",
          body: "Aradığınız sayfa taşınmış veya artık mevcut olmayabilir. Ana sayfaya dönebilir veya doğrudan randevu oluşturabilirsiniz.",
          home: "Ana sayfaya dön",
          appointment: "Randevu al",
        };

  return (
    <div className="page-hero">
      <div className="section-shell flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
        <span className="section-kicker">{copy.kicker}</span>
        <h1 className="section-title mt-6">{copy.title}</h1>
        <p className="section-subtitle mx-auto mt-4">{copy.body}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <LocaleLink href="/" className="btn-primary">
            {copy.home}
          </LocaleLink>
          <LocaleLink href="/appointment" className="btn-outline">
            {copy.appointment}
          </LocaleLink>
        </div>
      </div>
    </div>
  );
}
