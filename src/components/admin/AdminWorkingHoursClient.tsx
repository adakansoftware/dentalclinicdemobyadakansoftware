"use client";

import type { ActionResult } from "@/types";

import { useState, useActionState, startTransition } from "react";
import { upsertWorkingHourAction } from "@/actions/working-hours";

const DAYS = [
  { value: 1, label: "Pazartesi" }, { value: 2, label: "Salı" },
  { value: 3, label: "Çarşamba" }, { value: 4, label: "Perşembe" },
  { value: 5, label: "Cuma" }, { value: 6, label: "Cumartesi" },
  { value: 0, label: "Pazar" },
];

interface SpecialistItem { id: string; nameTr: string; }
interface WorkingHourItem {
  id: string; specialistId: string; dayOfWeek: number; startTime: string;
  endTime: string; slotMinutes: number; isOpen: boolean;
  specialist: { nameTr: string };
}
interface Props { specialists: SpecialistItem[]; workingHours: WorkingHourItem[]; }

const initialState: ActionResult = { success: false };

function DayRow({
  day,
  existing,
  specialistId,
}: {
  day: { value: number; label: string };
  existing?: WorkingHourItem;
  specialistId: string;
}) {
  const [isOpen, setIsOpen] = useState(existing ? existing.isOpen : day.value !== 0);
  const [state, formAction, isPending] = useActionState(upsertWorkingHourAction, initialState);

  return (
    <form
      action={(fd) => { startTransition(() => { void formAction(fd); }); }}
      className="card p-4 flex flex-wrap items-center gap-4"
    >
      <input type="hidden" name="specialistId" value={specialistId} />
      <input type="hidden" name="dayOfWeek" value={day.value} />
      <input type="hidden" name="isOpen" value={isOpen ? "true" : "false"} />

      <div className="w-28 font-medium text-gray-700 shrink-0">{day.label}</div>

      <label className="flex items-center gap-2 cursor-pointer">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${isOpen ? "bg-green-500" : "bg-gray-300"}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isOpen ? "translate-x-5" : "translate-x-0.5"}`} />
        </div>
        <span className="text-sm text-gray-600">{isOpen ? "Açık" : "Kapalı"}</span>
      </label>

      <div className={`flex items-center gap-4 ${!isOpen ? "opacity-40 pointer-events-none" : ""}`}>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 shrink-0">Başlangıç</span>
          <input type="time" name="startTime" defaultValue={existing?.startTime ?? "09:00"} className="form-input w-28 text-sm py-1.5" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 shrink-0">Bitiş</span>
          <input type="time" name="endTime" defaultValue={existing?.endTime ?? "18:00"} className="form-input w-28 text-sm py-1.5" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600 shrink-0">Slot (dk)</span>
          <select name="slotMinutes" defaultValue={existing?.slotMinutes ?? 30} className="form-input w-20 text-sm py-1.5">
            {[15, 20, 30, 45, 60].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        { state.success && <span className="text-green-600 text-sm">✓</span>}
        { state.error && <span className="text-red-500 text-xs">{state.error}</span>}
        <button type="submit" disabled={isPending}
          className="text-sm px-4 py-1.5 rounded-lg text-white font-medium transition-opacity disabled:opacity-60"
          style={{ background: "var(--color-primary)" }}>
          {isPending ? "..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}

export default function AdminWorkingHoursClient({ specialists, workingHours }: Props) {
  const [selectedSpecialist, setSelectedSpecialist] = useState(specialists[0]?.id ?? "");

  const hoursForSpecialist = workingHours.filter((wh) => wh.specialistId === selectedSpecialist);
  const hoursMap: Record<number, WorkingHourItem> = {};
  for (const wh of hoursForSpecialist) hoursMap[wh.dayOfWeek] = wh;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Çalışma Saatleri</h1>

      <div className="mb-6">
        <label className="form-label">Uzman Seçin</label>
        <select value={selectedSpecialist} onChange={(e) => setSelectedSpecialist(e.target.value)} className="form-input max-w-xs">
          {specialists.map((sp) => <option key={sp.id} value={sp.id}>{sp.nameTr}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {DAYS.map((day) => (
          <DayRow key={`${selectedSpecialist}-${day.value}`} day={day} existing={hoursMap[day.value]} specialistId={selectedSpecialist} />
        ))}
      </div>
    </div>
  );
}
