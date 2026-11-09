"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLang } from "@/context/LangContext";

type Props = ComponentProps<typeof Link>;

// Prefixes internal hrefs with /en while browsing the English locale so every
// hand-written Link stays unprefixed (canonical TR) in source.
export default function LocaleLink({ href, ...props }: Props) {
  const { lang } = useLang();

  const resolved =
    typeof href === "string" && lang === "en" && href.startsWith("/") && !href.startsWith("/en")
      ? `/en${href === "/" ? "" : href}`
      : href;

  return <Link href={resolved} {...props} />;
}
