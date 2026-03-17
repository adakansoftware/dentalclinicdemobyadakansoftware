"use client";

import type { ActionResult } from "@/types";

import { useActionState, startTransition } from "react";
import { approveReviewAction, deleteReviewAction } from "@/actions/reviews";
import type { ReviewData } from "@/types";

const initialState: ActionResult = { success: false };

export default function AdminReviewsClient({ reviews }: { reviews: ReviewData[] }) {
  const [approveState, approveAction] = useActionState(approveReviewAction, initialState);
  const [deleteState, deleteAction] = useActionState(deleteReviewAction, initialState);

  const pending = reviews.filter((r) => !r.isApproved);
  const approved = reviews.filter((r) => r.isApproved);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Yorumlar</h1>

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center">{pending.length}</span>
            Onay Bekleyenler
          </h2>
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="card p-5 border-l-4 border-yellow-400">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{r.patientName}</span>
                      <span className="text-yellow-400">{"★".repeat(r.ratingStars)}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{r.contentTr}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString("tr-TR")}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={(fd) => { startTransition(() => { void approveAction(fd); }); }}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="text-xs px-3 py-1.5 bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 text-green-700 font-medium">Onayla</button>
                    </form>
                    <form action={(fd) => { if (!confirm("Silmek istediğinize emin misiniz?")) return; startTransition(() => { void deleteAction(fd); }); }}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-600">Sil</button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-gray-700 mb-4">Onaylı Yorumlar ({approved.length})</h2>
        <div className="space-y-3">
          {approved.map((r) => (
            <div key={r.id} className="card p-5 border-l-4 border-green-400">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{r.patientName}</span>
                    <span className="text-yellow-400">{"★".repeat(r.ratingStars)}</span>
                    <span className="badge bg-green-100 text-green-700">Onaylı</span>
                  </div>
                  <p className="text-gray-600 text-sm">{r.contentTr}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(r.createdAt).toLocaleDateString("tr-TR")}</p>
                </div>
                <form action={(fd) => { if (!confirm("Silmek istediğinize emin misiniz?")) return; startTransition(() => { void deleteAction(fd); }); }}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-600">Sil</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
