"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Lang } from "@/types";

interface LangContextType {
  lang: Lang;
  toggleLang: () => void;
}

const LangContext = createContext<LangContextType>({
  lang: "tr",
  toggleLang: () => {},
});

function localizedPath(lang: Lang, pathname: string) {
  if (lang === "en") {
    return pathname.startsWith("/en") ? pathname : `/en${pathname === "/" ? "" : pathname}`;
  }
  return pathname.startsWith("/en") ? pathname.slice(3) || "/" : pathname;
}

export function LangProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const lang: Lang = pathname.startsWith("/en") ? "en" : "tr";

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Returning visitors who previously chose English get forwarded to /en once.
  useEffect(() => {
    if (pathname !== "/" || lang !== "tr") {
      return;
    }
    if (localStorage.getItem("lang") === "en") {
      router.replace("/en");
    }
  }, [pathname, lang, router]);

  const toggleLang = () => {
    const next = lang === "tr" ? "en" : "tr";
    localStorage.setItem("lang", next);
    router.push(localizedPath(next, pathname));
  };

  return (
    <LangContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
