"use client";

import { useLang } from "@/context/LangContext";
import SectionIntro from "@/components/shared/SectionIntro";
import { t } from "@/lib/translations";
import PageHero from "@/components/shared/PageHero";
import StarRating from "@/components/shared/StarRating";
import type { PublicReviewsData } from "@/types";

interface Props {
  data: PublicReviewsData;
}

function formatReviewDate(date: string, lang: "tr" | "en") {
  return new Intl.DateTimeFormat(lang === "tr" ? "tr-TR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ReviewsClient({ data }: Props) {
  const { lang } = useLang();
  const { reviews, placeName, placeUrl, averageRating, totalReviews, source } = data;

  return (
    <>
      <PageHero
        kicker={lang === "tr" ? "Yorumlar" : "Reviews"}
        title={t("reviews", "title", lang)}
        subtitle={t("reviews", "subtitle", lang)}
        minimal
      >
        <div className="hero-panel hero-panel--compact p-6">
          <div className="metric-card p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">
              {lang === "tr" ? "Genel puan" : "Overall rating"}
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
              {averageRating ? averageRating.toFixed(1) : reviews.length}
            </div>
            <div className="mt-2 text-sm text-[color:var(--text-secondary)]">
              {averageRating ? (totalReviews ? `${totalReviews} ${lang === "tr" ? "değerlendirme" : "reviews"}` : "") : lang === "tr" ? "yorum" : "reviews"}
              {source === "google" ? " · Google" : ""}
            </div>
          </div>
        </div>
      </PageHero>

      <section className="section-block">
        <div className="section-shell">
          {reviews.length === 0 ? (
            <div className="surface-panel p-12 text-center text-[color:var(--text-secondary)]">
              {lang === "tr" ? "Henüz onaylı yorum bulunmuyor." : "There are no approved reviews yet."}
            </div>
          ) : (
            <>
              <SectionIntro
                title={
                  source === "google"
                    ? lang === "tr"
                      ? "Hastalarımızın Google üzerindeki deneyimleri"
                      : "Patient experiences on Google"
                    : lang === "tr"
                      ? "Hastalarımızın klinik deneyimleri"
                      : "Patient experiences at our clinic"
                }
                subtitle={
                  placeName
                    ? lang === "tr"
                      ? `${placeName} için yayınlanan gerçek kullanıcı yorumları.`
                      : `Real user reviews published for ${placeName}.`
                    : undefined
                }
              />
              <div className="grid gap-6 lg:grid-cols-3">
                {reviews.map((review) => (
                  <article key={review.id} className="card flex h-full flex-col p-7">
                    <div className="flex items-center justify-between gap-3">
                      <StarRating stars={review.ratingStars} />
                      <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--accent-main)]">
                        {formatReviewDate(review.createdAt, lang)}
                      </span>
                    </div>
                    <p className="mt-5 flex-1 text-base leading-relaxed text-[color:var(--text-secondary)]">
                      &quot;{lang === "tr" ? review.contentTr : review.contentEn}&quot;
                    </p>
                    <div className="mt-6 border-t border-[rgba(207,216,211,0.84)] pt-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[rgba(227,235,230,0.9)]">
                          {review.authorPhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={review.authorPhotoUrl} alt={review.patientName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--accent-main)]">
                              {getInitials(review.patientName)}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[color:var(--text-primary)]">{review.patientName}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[color:var(--accent-main)]">
                            {review.sourceLabel ?? "Google"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="mx-auto mt-16 max-w-2xl editorial-panel p-7 md:p-8">
            <h2 className="text-center text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
              {source === "google"
                ? lang === "tr"
                  ? "Google üzerinden tüm yorumları inceleyin"
                  : "See all reviews on Google"
                : t("reviews", "writeReview", lang)}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-sm leading-relaxed text-[color:var(--text-secondary)]">
              {source === "google"
                ? lang === "tr"
                  ? "Sitede gösterilen yorumlar Google Places üzerinden alınmaktadır. Tam listeyi ve yorum detaylarını Google'da görebilirsiniz."
                  : "The reviews shown on this site are fetched from Google Places. You can view the full list and review details on Google."
                : lang === "tr"
                  ? "Google Places ayarları tanımlanana kadar mevcut yorumlar gösterilmeye devam eder."
                  : "Existing reviews continue to be shown until Google Places settings are configured."}
            </p>
            {placeUrl ? (
              <div className="mt-6 flex justify-center">
                <a href={placeUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  {lang === "tr" ? "Google Yorumlarını Aç" : "Open Google Reviews"}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
