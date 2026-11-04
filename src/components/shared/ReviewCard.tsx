import type { Lang, ReviewData } from "@/types";
import StarRating from "./StarRating";

interface Props {
  review: ReviewData;
  lang: Lang;
}

export default function ReviewCard({ review, lang }: Props) {
  const content = lang === "tr" ? review.contentTr : review.contentEn;
  const relativeDate = lang === "tr" ? review.relativeDateTr : review.relativeDateEn;
  const initials = review.patientName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <figure className="card flex h-full flex-col p-6">
      <StarRating stars={review.ratingStars} />
      <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-[color:var(--text-secondary)]">
        &ldquo;{content}&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t pt-5 text-sm" style={{ borderColor: "var(--border)" }}>
        {review.authorPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={review.authorPhotoUrl} alt={review.patientName} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(85,145,183,0.12)] text-sm font-bold text-[color:var(--accent-main)]">
            {initials}
          </span>
        )}
        <span className="flex flex-col">
          {review.sourceUrl ? (
            <a
              href={review.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[color:var(--text-primary)] hover:underline"
            >
              {review.patientName}
            </a>
          ) : (
            <span className="font-bold text-[color:var(--text-primary)]">{review.patientName}</span>
          )}
          <span className="text-xs text-[color:var(--text-secondary)]">
            {[review.sourceLabel, relativeDate].filter(Boolean).join(" · ")}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
