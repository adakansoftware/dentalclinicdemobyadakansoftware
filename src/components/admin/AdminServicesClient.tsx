"use client";

import Image from "next/image";
import { startTransition, useActionState, useEffect, useState } from "react";
import { createServiceAction, deleteServiceAction, updateServiceAction } from "@/actions/services";
import type { ActionResult, ServiceData } from "@/types";

const initialState: ActionResult = { success: false };

function ServiceForm({ service, onClose }: { service?: ServiceData; onClose: () => void }) {
  const action = service ? updateServiceAction : createServiceAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [imageValue, setImageValue] = useState(service?.imageUrl ?? "");
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    setImageValue(service?.imageUrl ?? "");
    setFileError("");
  }, [service]);

  if (state.success) {
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[rgba(207,216,211,0.84)] bg-[rgba(249,251,250,0.98)] shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[rgba(207,216,211,0.84)] p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent-main)]">Yönetim</p>
            <h2 className="text-xl font-bold text-[color:var(--text-primary)]">{service ? "Hizmet Düzenle" : "Yeni Hizmet"}</h2>
          </div>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>

        <form
          action={(fd) => {
            startTransition(() => void formAction(fd));
          }}
          className="space-y-5 p-6"
        >
          {service ? <input type="hidden" name="id" value={service.id} /> : null}
          <input type="hidden" name="imageUrl" value={imageValue} />

          {state.error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
          {fileError ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{fileError}</div> : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
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
            <div className="md:col-span-2">
              <label className="form-label">Açıklama (TR)</label>
              <textarea name="descriptionTr" defaultValue={service?.descriptionTr} className="form-input min-h-[96px]" required />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Açıklama (EN)</label>
              <textarea name="descriptionEn" defaultValue={service?.descriptionEn} className="form-input min-h-[96px]" required />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Görsel Yükle</label>
              <input
                type="file"
                accept="image/*"
                className="form-input"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 4 * 1024 * 1024) {
                    setFileError("Görsel en fazla 4 MB olabilir.");
                    event.target.value = "";
                    return;
                  }
                  setFileError("");
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") setImageValue(reader.result);
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <p className="mt-2 text-xs text-[color:var(--text-secondary)]">Yerelden görsel seçebilir veya aşağıya bağlantı yapıştırabilirsiniz.</p>
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Görsel URL</label>
              <input value={imageValue} onChange={(event) => setImageValue(event.target.value)} className="form-input" placeholder="https://... veya /images/services/service.jpg" />
            </div>
            {imageValue ? (
              <div className="md:col-span-2">
                <div className="relative h-40 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <Image src={imageValue} alt="Hizmet önizleme" fill sizes="224px" className="object-cover" unoptimized />
                </div>
              </div>
            ) : null}
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
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
              İptal
            </button>
            <button type="submit" disabled={isPending} className="btn-primary flex-1">
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
  const [, deleteAction, isDeleting] = useActionState(deleteServiceAction, initialState);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-main)]">İçerik Yönetimi</p>
          <h1 className="text-2xl font-bold text-[color:var(--text-primary)]">Hizmetler</h1>
        </div>
        <button onClick={() => { setEditing(undefined); setShowForm(true); }} className="btn-primary text-sm">
          + Yeni Hizmet
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-gray-100 bg-[rgba(241,245,243,0.92)]">
            <tr>
              {["Görsel", "Sıra", "Ad (TR)", "Süre", "Durum", "İşlemler"].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {services.map((svc) => (
              <tr key={svc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="relative h-12 w-16 overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                    <Image
                      src={svc.imageUrl || `/images/services/${svc.slug === "dis-beyazlatma" ? "whitening" : svc.slug === "kanal-tedavisi" ? "root-canal" : svc.slug === "cocuk-dis-hekimligi" ? "pediatric" : svc.slug}.svg`}
                      alt={svc.nameTr}
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized={Boolean(svc.imageUrl?.startsWith("data:"))}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{svc.order}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{svc.nameTr}</p>
                  <p className="text-xs text-gray-400">{svc.slug}</p>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{svc.durationMinutes} dk</td>
                <td className="px-4 py-3">
                  <span className={`badge ${svc.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{svc.isActive ? "Aktif" : "Pasif"}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(svc); setShowForm(true); }} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      Düzenle
                    </button>
                    <form action={(fd) => { if (!confirm("Silmek istediğinize emin misiniz?")) return; startTransition(() => void deleteAction(fd)); }}>
                      <input type="hidden" name="id" value={svc.id} />
                      <button type="submit" disabled={isDeleting} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
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

      {showForm ? <ServiceForm service={editing} onClose={() => { setShowForm(false); setEditing(undefined); }} /> : null}
    </div>
  );
}
