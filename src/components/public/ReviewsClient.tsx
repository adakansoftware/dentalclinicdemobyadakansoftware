"use client";

import { useLang } from "@/context/LangContext";
import SectionIntro from "@/components/shared/SectionIntro";
import { t } from "@/lib/translations";
import PageHero from "@/components/shared/PageHero";
import StarRating from "@/components/shared/StarRating";
import ReviewCard from "@/components/shared/ReviewCard";
import type { PublicReviewsData } from "@/types";

interface Props {
  data: PublicReviewsData;
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
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-[-0.02em] text-[color:var(--text-primary)]">
                {averageRating ? averageRating.toFixed(1) : reviews.length}
              </span>
              <span className="text-lg text-[color:var(--text-secondary)]">/ 5</span>
            </div>
            <div className="mt-3">
              <StarRating stars={averageRating ? Math.round(averageRating) : 5} />
            </div>
            <div className="mt-3 text-sm text-[color:var(--text-secondary)]">
              {averageRating ? (totalReviews ? `${totalReviews} ${lang === "tr" ? "değerlendirme" : "reviews"}` : "") : lang === "tr" ? "yorum" : "reviews"}
              {source === "google" ? " · Google" : ""}
            </div>
            {placeUrl ? (
              <a
                href={placeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex text-sm font-bold text-[color:var(--accent-main)] hover:underline"
              >
                {lang === "tr" ? "Google'da gör" : "View on Google"}
              </a>
            ) : null}
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
                  <ReviewCard key={review.id} review={review} lang={lang} />
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
