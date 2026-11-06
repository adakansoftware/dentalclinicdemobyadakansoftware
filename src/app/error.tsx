"use client";

import Link from "next/link";
import { LangProvider, useLang } from "@/context/LangContext";

function ErrorClient({ reset }: { reset: () => void }) {
  const { lang } = useLang();

  const copy =
    lang === "en"
      ? {
          kicker: "Unexpected error",
          title: "Something went wrong",
          body: "An unexpected error occurred while loading this page. Please try again.",
          retry: "Try again",
          home: "Back to home",
        }
      : {
          kicker: "Beklenmeyen hata",
          title: "Bir sorun oluştu",
          body: "Sayfa yüklenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
          retry: "Tekrar dene",
          home: "Ana sayfaya dön",
        };

  return (
    <div className="public-shell flex min-h-screen items-center justify-center px-4 py-24">
      <div className="premium-surface w-full max-w-lg rounded-[1.25rem] p-10 text-center md:p-14">
        <span className="section-kicker">{copy.kicker}</span>
        <h1 className="section-title mt-6">{copy.title}</h1>
        <p className="section-subtitle mx-auto mt-4">{copy.body}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">
            {copy.retry}
          </button>
          <Link href="/" className="btn-outline">
            {copy.home}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <LangProvider>
      <ErrorClient reset={reset} />
    </LangProvider>
  );
}
