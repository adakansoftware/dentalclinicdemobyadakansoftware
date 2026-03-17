"use client";

import type { ActionResult } from "@/types";

import { useState, useActionState, startTransition } from "react";
import {
  createSpecialistAction,
  updateSpecialistAction,
  deleteSpecialistAction,
  assignServiceAction,
  removeServiceAssignmentAction,
} from "@/actions/specialists";
import type { ServiceData } from "@/types";

interface SpecialistServiceItem { id: string; service: ServiceData; }
interface SpecialistItem {
  id: string; slug: string; nameTr: string; nameEn: string;
  titleTr: string; titleEn: string; biographyTr: string; biographyEn: string;
  photoUrl: string; order: number; isActive: boolean;
  specialistServices: SpecialistServiceItem[];
}

interface Props { specialists: SpecialistItem[]; services: ServiceData[]; }

const initialState: ActionResult = { success: false };

function SpecialistForm({ specialist, onClose }: { specialist?: SpecialistItem; onClose: () => void }) {
  const action = specialist ? updateSpecialistAction : createSpecialistAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (state.success) { onClose(); return null; }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">{specialist ? "Uzman Düzenle" : "Yeni Uzman"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>
        <form action={(fd) => { startTransition(() => { void formAction(fd); }); }} className="p-6 space-y-4">
          {specialist && <input type="hidden" name="id" value={specialist.id} />}
          { state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{state.error}</div>
          )}
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
              <label className="form-label">Fotoğraf URL</label>
              <input name="photoUrl" defaultValue={specialist?.photoUrl} className="form-input" placeholder="https://..." />
            </div>
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
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600">İptal</button>
            <button type="submit" disabled={isPending} className="flex-1 btn-primary">
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

  const [deleteState, deleteAction] = useActionState(deleteSpecialistAction, initialState);
  const [assignState, assignAction] = useActionState(assignServiceAction, initialState);
  const [removeState, removeAction] = useActionState(removeServiceAssignmentAction, initialState);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Uzmanlar</h1>
        <button onClick={() => { setEditing(undefined); setShowForm(true); }} className="btn-primary text-sm">
          + Yeni Uzman
        </button>
      </div>

      <div className="space-y-4">
        {specialists.map((sp) => (
          <div key={sp.id} className="card">
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0" style={{ background: "var(--color-primary-light)" }}>
                {sp.photoUrl ? <img src={sp.photoUrl} alt={sp.nameTr} className="w-full h-full rounded-full object-cover" /> : "👨‍⚕️"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{sp.nameTr}</p>
                <p className="text-sm text-gray-500">{sp.titleTr}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {sp.specialistServices.map(({ service }) => (
                    <span key={service.id} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{service.nameTr}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setExpanded(expanded === sp.id ? null : sp.id)}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                  Hizmetler
                </button>
                <button onClick={() => { setEditing(sp); setShowForm(true); }}
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700">
                  Düzenle
                </button>
                <form action={(fd) => { if (!confirm("Silmek istediğinize emin misiniz?")) return; startTransition(() => { void deleteAction(fd); }); }}>
                  <input type="hidden" name="id" value={sp.id} />
                  <button type="submit" className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-600">Sil</button>
                </form>
              </div>
            </div>

            {expanded === sp.id && (
              <div className="border-t border-gray-100 p-5">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Hizmet Ataması</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {sp.specialistServices.map(({ id, service }) => (
                    <div key={id} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 rounded-full text-sm">
                      <span className="text-blue-700">{service.nameTr}</span>
                      <form action={(fd) => { startTransition(() => { void removeAction(fd); }); }}>
                        <input type="hidden" name="id" value={id} />
                        <button type="submit" className="text-blue-400 hover:text-red-500 ml-1 font-bold">&times;</button>
                      </form>
                    </div>
                  ))}
                </div>
                <form action={(fd) => { startTransition(() => { void assignAction(fd); }); }} className="flex gap-2">
                  <input type="hidden" name="specialistId" value={sp.id} />
                  <select name="serviceId" className="form-input flex-1 text-sm">
                    {services
                      .filter((s) => !sp.specialistServices.some((ss) => ss.service.id === s.id))
                      .map((s) => <option key={s.id} value={s.id}>{s.nameTr}</option>)}
                  </select>
                  <button type="submit" className="btn-primary text-sm px-4 py-2">Ekle</button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <SpecialistForm specialist={editing} onClose={() => { setShowForm(false); setEditing(undefined); }} />
      )}
    </div>
  );
}
