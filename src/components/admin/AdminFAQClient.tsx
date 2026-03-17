"use client";

import type { ActionResult } from "@/types";

import { useState, useActionState, startTransition } from "react";
import { createFAQAction, updateFAQAction, deleteFAQAction } from "@/actions/faq";
import type { FAQData } from "@/types";

const initialState: ActionResult = { success: false };

function FAQForm({ item, onClose }: { item?: FAQData; onClose: () => void }) {
  const action = item ? updateFAQAction : createFAQAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  if (state.success) { onClose(); return null; }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{item ? "SSS Düzenle" : "Yeni SSS"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <form action={(fd) => { startTransition(() => { void formAction(fd); }); }} className="p-6 space-y-4">
          {item && <input type="hidden" name="id" value={item.id} />}
          { state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{state.error}</div>
          )}
          <div>
            <label className="form-label">Soru (TR)</label>
            <input name="questionTr" defaultValue={item?.questionTr} className="form-input" required />
          </div>
          <div>
            <label className="form-label">Soru (EN)</label>
            <input name="questionEn" defaultValue={item?.questionEn} className="form-input" required />
          </div>
          <div>
            <label className="form-label">Cevap (TR)</label>
            <textarea name="answerTr" defaultValue={item?.answerTr} className="form-input min-h-[80px]" required />
          </div>
          <div>
            <label className="form-label">Cevap (EN)</label>
            <textarea name="answerEn" defaultValue={item?.answerEn} className="form-input min-h-[80px]" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Sıra</label>
              <input name="order" type="number" defaultValue={item?.order ?? 0} className="form-input" />
            </div>
            <div>
              <label className="form-label">Durum</label>
              <select name="isActive" defaultValue={String(item?.isActive ?? true)} className="form-input">
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600">İptal</button>
            <button type="submit" disabled={isPending} className="flex-1 btn-primary">{isPending ? "Kaydediliyor..." : "Kaydet"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminFAQClient({ faqs }: { faqs: FAQData[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FAQData | undefined>();
  const [deleteState, deleteAction] = useActionState(deleteFAQAction, initialState);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SSS</h1>
        <button onClick={() => { setEditing(undefined); setShowForm(true); }} className="btn-primary text-sm">+ Yeni SSS</button>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <div key={faq.id} className="card p-5 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{faq.questionTr}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{faq.answerTr}</p>
              <div className="flex gap-2 mt-2">
                <span className={`badge ${faq.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {faq.isActive ? "Aktif" : "Pasif"}
                </span>
                <span className="badge bg-gray-100 text-gray-500">Sıra: {faq.order}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => { setEditing(faq); setShowForm(true); }}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">Düzenle</button>
              <form action={(fd) => { if (!confirm("Silmek istediğinize emin misiniz?")) return; startTransition(() => { void deleteAction(fd); }); }}>
                <input type="hidden" name="id" value={faq.id} />
                <button type="submit" className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-600">Sil</button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {showForm && <FAQForm item={editing} onClose={() => { setShowForm(false); setEditing(undefined); }} />}
    </div>
  );
}
