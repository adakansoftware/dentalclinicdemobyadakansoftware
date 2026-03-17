"use client";

import { useState, useActionState, startTransition } from "react";
import { createServiceAction, updateServiceAction, deleteServiceAction } from "@/actions/services";
import type { ServiceData, ActionResult } from "@/types";

const initialState: ActionResult = { success: false };

function ServiceForm({
  service,
  onClose,
}: {
  service?: ServiceData;
  onClose: () => void;
}) {
  const action = service ? updateServiceAction : createServiceAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (state.success) {
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{service ? "Hizmet Düzenle" : "Yeni Hizmet"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <form action={(fd) => { startTransition(() => { void formAction(fd); }); }} className="p-6 space-y-4">
          {service && <input type="hidden" name="id" value={service.id} />}
          { state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{state.error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Slug (URL)</label>
              <input name="slug" defaultValue={service?.slug} className="form-input" required placeholder="implant-tedavisi" />
            </div>
            <div>
              <label className="form-label">Adı (TR)</label>
              <input name="nameTr" defaultValue={service?.nameTr} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Adı (EN)</label>
              <input name="nameEn" defaultValue={service?.nameEn} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Kısa Açıklama (TR)</label>
              <input name="shortDescTr" defaultValue={service?.shortDescTr} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Kısa Açıklama (EN)</label>
              <input name="shortDescEn" defaultValue={service?.shortDescEn} className="form-input" required />
            </div>
            <div className="col-span-2">
              <label className="form-label">Açıklama (TR)</label>
              <textarea name="descriptionTr" defaultValue={service?.descriptionTr} className="form-input min-h-[80px]" required />
            </div>
            <div className="col-span-2">
              <label className="form-label">Açıklama (EN)</label>
              <textarea name="descriptionEn" defaultValue={service?.descriptionEn} className="form-input min-h-[80px]" required />
            </div>
            <div>
              <label className="form-label">Süre (dakika)</label>
              <input name="durationMinutes" type="number" defaultValue={service?.durationMinutes ?? 30} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Sıra</label>
              <input name="order" type="number" defaultValue={service?.order ?? 0} className="form-input" />
            </div>
            <div>
              <label className="form-label">Durum</label>
              <select name="isActive" defaultValue={String(service?.isActive ?? true)} className="form-input">
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">İptal</button>
            <button type="submit" disabled={isPending} className="flex-1 btn-primary">
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminServicesClient({ services }: { services: ServiceData[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ServiceData | undefined>();
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteServiceAction, initialState);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hizmetler</h1>
        <button onClick={() => { setEditing(undefined); setShowForm(true); }} className="btn-primary text-sm">
          + Yeni Hizmet
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Sıra", "Ad (TR)", "Süre", "Durum", "İşlemler"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {services.map((svc) => (
              <tr key={svc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500">{svc.order}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{svc.nameTr}</p>
                  <p className="text-xs text-gray-400">{svc.slug}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{svc.durationMinutes} dk</td>
                <td className="px-4 py-3">
                  <span className={`badge ${svc.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {svc.isActive ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(svc); setShowForm(true); }}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium text-gray-700">
                      Düzenle
                    </button>
                    <form action={(fd) => { if (!confirm("Silmek istediğinize emin misiniz?")) return; startTransition(() => { void deleteAction(fd); }); }}>
                      <input type="hidden" name="id" value={svc.id} />
                      <button type="submit" disabled={isDeleting}
                        className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 font-medium text-red-600">
                        Sil
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ServiceForm service={editing} onClose={() => { setShowForm(false); setEditing(undefined); }} />
      )}
    </div>
  );
}
