"use client";

import { useActionState, startTransition } from "react";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import { submitReviewAction } from "@/actions/reviews";
import type { ReviewData, ActionResult } from "@/types";

interface Props { reviews: ReviewData[]; }

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5 text-xl">
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={s <= stars ? "text-yellow-400" : "text-gray-200"}>★</span>
      ))}
    </div>
  );
}

const initialState: ActionResult = { success: false, error: "" };

export default function ReviewsClient({ reviews }: Props) {
  const { lang } = useLang();
  const [state, formAction, isPending] = useActionState(submitReviewAction, initialState);

  return (
    <>
      <div className="py-16 text-center text-white" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #145470))" }}>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("reviews", "title", lang)}</h1>
        <p className="text-white/80 text-lg">{t("reviews", "subtitle", lang)}</p>
      </div>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {reviews.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              {lang === "tr" ? "Henüz onaylı yorum yok." : "No approved reviews yet."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              {reviews.map((r) => (
                <div key={r.id} className="card p-6">
                  <StarRating stars={r.ratingStars} />
                  <p className="text-gray-700 mt-3 leading-relaxed italic">
                    "{lang === "tr" ? r.contentTr : r.contentEn}"
                  </p>
                  <p className="mt-4 font-semibold text-gray-900 text-sm">{r.patientName}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(r.createdAt).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US")}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Submit review form */}
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {t("reviews", "writeReview", lang)}
            </h2>
            {state.success ? (
              <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl text-center">
                {t("reviews", "success", lang)}
              </div>
            ) : (
              <form
                action={(fd) => { startTransition(() => { void formAction(fd); }); }}
                className="card p-6 space-y-4"
              >
                { state.error && !state.success && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {state.error}
                  </div>
                )}
                <div>
                  <label className="form-label">{t("reviews", "yourName", lang)} *</label>
                  <input name="patientName" className="form-input" required />
                </div>
                <div>
                  <label className="form-label">{t("reviews", "rating", lang)}</label>
                  <select name="ratingStars" className="form-input" defaultValue="5">
                    {[5,4,3,2,1].map((s) => (
                      <option key={s} value={s}>{s} ★</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">{t("reviews", "comment", lang)} *</label>
                  <textarea name="contentTr" className="form-input min-h-[100px]" required />
                  <input type="hidden" name="contentEn" value="" />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary w-full"
                >
                  {isPending ? t("common", "loading", lang) : t("reviews", "submit", lang)}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
