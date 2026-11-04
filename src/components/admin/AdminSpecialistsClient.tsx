"use client";

import Image from "next/image";
import { startTransition, useActionState, useEffect, useState } from "react";
import { assignServiceAction, createSpecialistAction, deleteSpecialistAction, removeServiceAssignmentAction, updateSpecialistAction } from "@/actions/specialists";
import type { ActionResult, ServiceData } from "@/types";

interface SpecialistServiceItem {
  id: string;
  service: ServiceData;
}

interface SpecialistItem {
  id: string;
  slug: string;
  nameTr: string;
  nameEn: string;
  titleTr: string;
  titleEn: string;
  biographyTr: string;
  biographyEn: string;
  photoUrl: string;
  order: number;
  isActive: boolean;
  specialistServices: SpecialistServiceItem[];
}

interface Props {
  specialists: SpecialistItem[];
  services: ServiceData[];
}

const initialState: ActionResult = { success: false };

function SpecialistForm({ specialist, onClose }: { specialist?: SpecialistItem; onClose: () => void }) {
  const action = specialist ? updateSpecialistAction : createSpecialistAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [photoValue, setPhotoValue] = useState(specialist?.photoUrl ?? "");
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    setPhotoValue(specialist?.photoUrl ?? "");
    setFileError("");
  }, [specialist]);

  if (state.success) {
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[color:var(--border)] bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[color:var(--border)] p-6">
          <h2 className="font-bold text-[color:var(--text-primary)]">{specialist ? "Uzman Düzenle" : "Yeni Uzman"}</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        <form action={(fd) => startTransition(() => void formAction(fd))} className="space-y-4 p-6">
          {specialist ? <input type="hidden" name="id" value={specialist.id} /> : null}
          <input type="hidden" name="photoUrl" value={photoValue} />
          {state.error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
          {fileError ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{fileError}</div> : null}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="form-label">Slug</label>
              <input name="slug" defaultValue={specialist?.slug} className="form-input" required placeholder="dr-ad-soyad" />
            </div>
            <div>
              <label className="form-label">Adı (TR)</label>
              <input name="nameTr" defaultValue={specialist?.nameTr} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Adı (EN)</label>
              <input name="nameEn" defaultValue={specialist?.nameEn} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Unvan (TR)</label>
              <input name="titleTr" defaultValue={specialist?.titleTr} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Unvan (EN)</label>
              <input name="titleEn" defaultValue={specialist?.titleEn} className="form-input" required />
            </div>
            <div className="col-span-2">
              <label className="form-label">Biyografi (TR)</label>
              <textarea name="biographyTr" defaultValue={specialist?.biographyTr} className="form-input min-h-[80px]" required />
            </div>
            <div className="col-span-2">
              <label className="form-label">Biyografi (EN)</label>
              <textarea name="biographyEn" defaultValue={specialist?.biographyEn} className="form-input min-h-[80px]" required />
            </div>
            <div className="col-span-2">
              <label className="form-label">Fotoğraf Yükle</label>
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
                    if (typeof reader.result === "string") setPhotoValue(reader.result);
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <p className="mt-2 text-xs text-[color:var(--text-secondary)]">Yerelden görsel seçebilir veya aşağıya bağlantı yapıştırabilirsiniz.</p>
            </div>
            <div className="col-span-2">
              <label className="form-label">Fotoğraf URL</label>
              <input value={photoValue} onChange={(event) => setPhotoValue(event.target.value)} className="form-input" placeholder="https://..." />
            </div>
            {photoValue ? (
              <div className="col-span-2">
                <div className="relative h-44 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <Image src={photoValue} alt="Uzman önizleme" fill sizes="176px" className="object-cover" unoptimized />
                </div>
              </div>
            ) : null}
            <div>
              <label className="form-label">Sıra</label>
              <input name="order" type="number" defaultValue={specialist?.order ?? 0} className="form-input" />
            </div>
            <div>
              <label className="form-label">Durum</label>
              <select name="isActive" defaultValue={String(specialist?.isActive ?? true)} className="form-input">
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600">
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

export default function AdminSpecialistsClient({ specialists, services }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SpecialistItem | undefined>();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [, deleteAction] = useActionState(deleteSpecialistAction, initialState);
  const [, assignAction] = useActionState(assignServiceAction, initialState);
  const [, removeAction] = useActionState(removeServiceAssignmentAction, initialState);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[color:var(--text-primary)]">Uzmanlar</h1>
        <button onClick={() => { setEditing(undefined); setShowForm(true); }} className="btn-primary text-sm">
          + Yeni Uzman
        </button>
      </div>

      <div className="space-y-4">
        {specialists.map((sp) => (
          <div key={sp.id} className="card">
            <div className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[rgba(85,145,183,0.12)] text-[10px] font-semibold tracking-[0.12em] text-[color:var(--accent-main)]">
                {sp.photoUrl ? (
                  <Image src={sp.photoUrl} alt={sp.nameTr} width={48} height={48} sizes="48px" className="h-full w-full rounded-full object-cover" unoptimized={sp.photoUrl.startsWith("data:")} />
                ) : (
                  "UZ"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[color:var(--text-primary)]">{sp.nameTr}</p>
                <p className="text-sm text-[color:var(--text-secondary)]">{sp.titleTr}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {sp.specialistServices.map(({ service }) => (
                    <span key={service.id} className="service-chip">{service.nameTr}</span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 flex gap-2">
                <button onClick={() => setExpanded(expanded === sp.id ? null : sp.id)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                  Hizmetler
                </button>
                <button onClick={() => { setEditing(sp); setShowForm(true); }} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50">
                  Düzenle
                </button>
                <form action={(fd) => { if (!confirm("Silmek istediğinize emin misiniz?")) return; startTransition(() => void deleteAction(fd)); }}>
                  <input type="hidden" name="id" value={sp.id} />
                  <button type="submit" className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                    Sil
                  </button>
                </form>
              </div>
            </div>

            {expanded === sp.id ? (
              <div className="border-t border-gray-100 p-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">Hizmet Ataması</h3>
                <div className="mb-3 flex flex-wrap gap-2">
                  {sp.specialistServices.map(({ id, service }) => (
                    <div key={id} className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-sm">
                      <span className="text-blue-700">{service.nameTr}</span>
                      <form action={(fd) => startTransition(() => void removeAction(fd))}>
                        <input type="hidden" name="id" value={id} />
                        <button type="submit" className="ml-1 font-bold text-blue-400 hover:text-red-500">&times;</button>
                      </form>
                    </div>
                  ))}
                </div>
                <form action={(fd) => startTransition(() => void assignAction(fd))} className="flex gap-2">
                  <input type="hidden" name="specialistId" value={sp.id} />
                  <select name="serviceId" className="form-input flex-1 text-sm">
                    {services.filter((s) => !sp.specialistServices.some((ss) => ss.service.id === s.id)).map((s) => (
                      <option key={s.id} value={s.id}>{s.nameTr}</option>
                    ))}
                  </select>
                  <button type="submit" className="btn-primary px-4 py-2 text-sm">Ekle</button>
                </form>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {showForm ? <SpecialistForm specialist={editing} onClose={() => { setShowForm(false); setEditing(undefined); }} /> : null}
    </div>
  );
}
