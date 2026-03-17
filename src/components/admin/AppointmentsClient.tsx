"use client";

import { useState, useActionState, startTransition } from "react";
import { updateAppointmentStatusAction } from "@/actions/appointment";
import type { ActionResult } from "@/types";

interface ServiceItem { nameTr: string; }
interface SpecialistItem { nameTr: string; }
interface AppointmentItem {
  id: string; patientName: string; patientPhone: string; patientEmail: string;
  patientNote: string; adminNote: string; date: Date | string; startTime: string; endTime: string;
  status: string; patientLanguage: string; smsSent: boolean; createdAt: Date | string;
  service: ServiceItem; specialist: SpecialistItem;
}
interface Props { appointments: AppointmentItem[]; }

const STATUS_OPTS = ["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor", CONFIRMED: "Onaylandı", CANCELLED: "İptal", COMPLETED: "Tamamlandı",
};
const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-pending", CONFIRMED: "badge-confirmed", CANCELLED: "badge-cancelled", COMPLETED: "badge-completed",
};

const initialState: ActionResult = { success: false };

function AppointmentModal({ apt, onClose }: { apt: AppointmentItem; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(updateAppointmentStatusAction, initialState);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-lg">Randevu Detayı</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{state.error}</div>
          )}
          {state.success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">Güncellendi ✓</div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Hasta", apt.patientName], ["Telefon", apt.patientPhone],
              ["E-posta", apt.patientEmail || "—"], ["Hizmet", apt.service.nameTr],
              ["Uzman", apt.specialist.nameTr],
              ["Tarih/Saat", `${new Date(apt.date).toLocaleDateString("tr-TR")} ${apt.startTime}-${apt.endTime}`],
              ["Dil", apt.patientLanguage], ["SMS", apt.smsSent ? "Gönderildi" : "Gönderilmedi"],
            ].map(([k, v]) => (
              <div key={k}>
                <span className="text-gray-500 text-xs">{k}</span>
                <p className="font-medium text-gray-900">{v}</p>
              </div>
            ))}
          </div>

          {apt.patientNote && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <p className="text-gray-500 text-xs mb-1">Hasta Notu</p>
              <p className="text-gray-700">{apt.patientNote}</p>
            </div>
          )}

          <form
            action={(fd) => { startTransition(() => { void formAction(fd); }); }}
            className="space-y-4 border-t border-gray-100 pt-4"
          >
            <input type="hidden" name="id" value={apt.id} />
            <div>
              <label className="form-label">Durum</label>
              <select name="status" defaultValue={apt.status} className="form-input">
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Admin Notu</label>
              <textarea name="adminNote" defaultValue={apt.adminNote} className="form-input min-h-[80px]" />
            </div>
            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsClient({ appointments }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<AppointmentItem | null>(null);

  const filtered = appointments.filter((a) => {
    const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
    const matchSearch = !search || a.patientName.toLowerCase().includes(search.toLowerCase()) || a.patientPhone.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Randevular</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input placeholder="Ad veya telefon ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input max-w-xs" />
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTS.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${statusFilter === s ? "border-transparent text-white" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
              style={statusFilter === s ? { background: "var(--color-primary)" } : {}}>
              {s === "ALL" ? "Tümü" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Hasta", "Telefon", "Hizmet", "Uzman", "Tarih/Saat", "Durum"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">Randevu bulunamadı</td></tr>
              ) : (
                filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(apt)}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{apt.patientName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{apt.patientPhone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{apt.service.nameTr}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{apt.specialist.nameTr}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(apt.date).toLocaleDateString("tr-TR")} {apt.startTime}</td>
                    <td className="px-4 py-3">
                      <span className={STATUS_BADGE[apt.status] ?? "badge"}>{STATUS_LABELS[apt.status] ?? apt.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <AppointmentModal apt={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
