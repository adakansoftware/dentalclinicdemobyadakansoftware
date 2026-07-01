"use client";

import { useActionState, useState, startTransition } from "react";
import { updateAppointmentStatusAction } from "@/actions/appointment";
import { getAllowedAppointmentTransitions } from "@/lib/appointment-state";
import type { ActionResult } from "@/types";

interface ServiceItem {
  nameTr: string;
}

interface SpecialistItem {
  nameTr: string;
}

interface AppointmentItem {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientNote: string;
  adminNote: string;
  date: Date | string;
  startTime: string;
  endTime: string;
  status: string;
  patientLanguage: string;
  smsSent: boolean;
  createdAt: Date | string;
  service: ServiceItem;
  specialist: SpecialistItem;
}

interface Props {
  appointments: AppointmentItem[];
}

const STATUS_OPTS = ["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  CONFIRMED: "Onaylandı",
  CANCELLED: "İptal Edildi",
  COMPLETED: "Tamamlandı",
};
const STATUS_BADGE: Record<string, string> = {
  PENDING: "badge-pending",
  CONFIRMED: "badge-confirmed",
  CANCELLED: "badge-cancelled",
  COMPLETED: "badge-completed",
};

const initialState: ActionResult = { success: false };

function AppointmentModal({ apt, onClose }: { apt: AppointmentItem; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(updateAppointmentStatusAction, initialState);
  const statusOptions = Array.from(
    new Set([apt.status, ...getAllowedAppointmentTransitions(apt.status as "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED")])
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900">Randevu Detayı</h2>
          <button onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-600">
            &times;
          </button>
        </div>

        <div className="space-y-4 p-6">
          {state.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div>
          ) : null}
          {state.success ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Güncellendi</div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Hasta", apt.patientName],
              ["Telefon", apt.patientPhone],
              ["E-posta", apt.patientEmail || "-"],
              ["Hizmet", apt.service.nameTr],
              ["Uzman", apt.specialist.nameTr],
              ["Tarih/Saat", `${new Date(apt.date).toLocaleDateString("tr-TR")} ${apt.startTime}-${apt.endTime}`],
              ["Dil", apt.patientLanguage],
              ["SMS", apt.smsSent ? "Gönderildi" : "Gönderilmedi"],
            ].map(([label, value]) => (
              <div key={label}>
                <span className="text-xs text-gray-500">{label}</span>
                <p className="font-medium text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {apt.patientNote ? (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="mb-1 text-xs text-gray-500">Hasta Notu</p>
              <p className="text-gray-700">{apt.patientNote}</p>
            </div>
          ) : null}

          <form
            action={(formData) => {
              startTransition(() => {
                void formAction(formData);
              });
            }}
            className="space-y-4 border-t border-gray-100 pt-4"
          >
            <input type="hidden" name="id" value={apt.id} />

            <div>
              <label className="form-label">Durum</label>
              <select name="status" defaultValue={apt.status} className="form-input">
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status] ?? status}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">Sadece izin verilen durum geçişleri listelenir.</p>
            </div>

            <div>
              <label className="form-label">Admin Notu</label>
              <textarea name="adminNote" defaultValue={apt.adminNote} className="form-input min-h-[80px]" />
            </div>

            <div>
              <label className="form-label">Admin Sifresi</label>
              <input
                name="stepUpPassword"
                type="password"
                className="form-input"
                autoComplete="current-password"
                placeholder="Iptal / tamamlandi gecislerinde gerekebilir"
              />
              <p className="mt-2 text-xs text-gray-500">Kritik durum degisikliklerinde son 10 dakikalik dogrulama aranir.</p>
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

  const filtered = appointments.filter((appointment) => {
    const matchStatus = statusFilter === "ALL" || appointment.status === statusFilter;
    const matchSearch =
      !search ||
      appointment.patientName.toLowerCase().includes(search.toLowerCase()) ||
      appointment.patientPhone.includes(search);

    return matchStatus && matchSearch;
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Randevular</h1>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="Ad veya telefon ara..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="form-input max-w-xs"
        />

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === status ? "border-transparent text-white" : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
              style={statusFilter === status ? { background: "var(--color-primary)" } : {}}
            >
              {status === "ALL" ? "Tümü" : STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                {["Hasta", "Telefon", "Hizmet", "Uzman", "Tarih/Saat", "Durum"].map((header) => (
                  <th key={header} className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Randevu bulunamadı
                  </td>
                </tr>
              ) : (
                filtered.map((appointment) => (
                  <tr key={appointment.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelected(appointment)}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{appointment.patientName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{appointment.patientPhone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{appointment.service.nameTr}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{appointment.specialist.nameTr}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(appointment.date).toLocaleDateString("tr-TR")} {appointment.startTime}
                    </td>
                    <td className="px-4 py-3">
                      <span className={STATUS_BADGE[appointment.status] ?? "badge"}>
                        {STATUS_LABELS[appointment.status] ?? appointment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? <AppointmentModal apt={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
