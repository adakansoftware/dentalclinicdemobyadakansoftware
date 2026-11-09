"use client";

import SectionIntro from "@/components/shared/SectionIntro";
import ReviewCard from "@/components/shared/ReviewCard";
import type { ReviewData } from "@/types";

interface Props {
  lang: "tr" | "en";
  reviews: ReviewData[];
}

export default function ReviewsSection({ lang, reviews }: Props) {
  const visibleReviews = reviews.filter((review) => review.isApproved && review.isVisible).slice(0, 3);

  return (
    <section className="soft-section section-block">
      <div className="section-shell">
        <SectionIntro
          kicker={lang === "tr" ? "Hasta Yorumları" : "Reviews"}
          title={lang === "tr" ? "Hastalarımızın klinik deneyimi hakkındaki geri bildirimleri" : "Feedback from patients about their clinical experience"}
          subtitle={lang === "tr" ? "Muayene, tedavi süreci ve klinik yaklaşımımız hakkındaki yorumları inceleyebilirsiniz." : "You can review comments about examinations, treatment care, and the overall clinic approach."}
        />

        {visibleReviews.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {visibleReviews.map((review) => (
              <ReviewCard key={review.id} review={review} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="surface-panel p-10 text-center text-sm leading-relaxed text-[color:var(--text-secondary)]">
            {lang === "tr" ? "Yorumlar burada sakin ve güven veren bir düzende yer alacak." : "Reviews will appear here in a calm, trust-building layout."}
          </div>
        )}
      </div>
    </section>
  );
}
