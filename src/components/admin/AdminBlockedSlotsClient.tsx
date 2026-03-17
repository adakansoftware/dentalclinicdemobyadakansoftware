"use client";

import type { ActionResult } from "@/types";

import { useActionState, startTransition } from "react";
import { createBlockedSlotAction, deleteBlockedSlotAction } from "@/actions/working-hours";

interface SpecialistItem { id: string; nameTr: string; }
interface BlockedSlotItem {
  id: string; specialistId: string; date: Date | string; startTime: string;
  endTime: string; reason: string;
  specialist: { nameTr: string };
}
interface Props { specialists: SpecialistItem[]; blockedSlots: BlockedSlotItem[]; }

const initialState: ActionResult = { success: false };

export default function AdminBlockedSlotsClient({ specialists, blockedSlots }: Props) {
  const [createState, createAction, isCreating] = useActionState(createBlockedSlotAction, initialState);
  const [deleteState, deleteAction] = useActionState(deleteBlockedSlotAction, initialState);

  const today = new Date().toISOString().split("T")[0] ?? "";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bloke Slotlar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create form */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Yeni Bloke Ekle</h2>
          {"error" in createState && createState.error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{createState.error}</div>
          )}
          {"success" in createState && createState.success && (
            <div className="mb-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">Eklendi ✓</div>
          )}
          <form action={(fd) => { startTransition(() => { void createAction(fd); }); }} className="space-y-3">
            <div>
              <label className="form-label">Uzman</label>
              <select name="specialistId" className="form-input" required>
                {specialists.map((sp) => <option key={sp.id} value={sp.id}>{sp.nameTr}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Tarih</label>
              <input name="date" type="date" min={today} className="form-input" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Başlangıç</label>
                <input name="startTime" type="time" defaultValue="09:00" className="form-input" required />
              </div>
              <div>
                <label className="form-label">Bitiş</label>
                <input name="endTime" type="time" defaultValue="18:00" className="form-input" required />
              </div>
            </div>
            <div>
              <label className="form-label">Neden (isteğe bağlı)</label>
              <input name="reason" className="form-input" placeholder="İzin, toplantı..." />
            </div>
            <button type="submit" disabled={isCreating} className="btn-primary w-full">
              {isCreating ? "Ekleniyor..." : "Bloke Ekle"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Mevcut Bloklar</h2>
          </div>
          {blockedSlots.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">Bloke slot yok</div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {blockedSlots.map((bs) => (
                <div key={bs.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{bs.specialist.nameTr}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(bs.date).toLocaleDateString("tr-TR")} · {bs.startTime}-{bs.endTime}
                    </p>
                    {bs.reason && <p className="text-xs text-gray-400 mt-0.5">{bs.reason}</p>}
                  </div>
                  <form action={(fd) => { startTransition(() => { void deleteAction(fd); }); }}>
                    <input type="hidden" name="id" value={bs.id} />
                    <button type="submit" className="text-xs px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-600">Sil</button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
