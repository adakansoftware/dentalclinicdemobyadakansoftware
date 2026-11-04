import Link from "next/link";
import type { Lang, SpecialistData } from "@/types";

interface Props {
  specialist: SpecialistData;
  href: string;
  lang: Lang;
  ctaLabel: string;
}

export default function DoctorCard({ specialist, href, lang, ctaLabel }: Props) {
  const name = lang === "tr" ? specialist.nameTr : specialist.nameEn;
  const title = lang === "tr" ? specialist.titleTr : specialist.titleEn;
  const bio = lang === "tr" ? specialist.biographyTr : specialist.biographyEn;
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <Link href={href} className="card group">
      <div className="relative aspect-[4/4.4] overflow-hidden rounded-t-[1.25rem] bg-[color:var(--surface-muted)]">
        {specialist.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={specialist.photoUrl}
            alt={name}
            className="image-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-5xl text-[color:var(--accent-soft)]">{initials}</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">{title}</p>
        <h3 className="mt-2 text-xl font-bold text-[color:var(--text-primary)]">{name}</h3>
        {bio ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[color:var(--text-secondary)]">{bio}</p> : null}
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[color:var(--accent-main)]">
          {ctaLabel}
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h9.6l-3.3-3.3a1 1 0 111.4-1.4l5 5a1 1 0 010 1.4l-5 5a1 1 0 11-1.4-1.4L13.6 11H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
