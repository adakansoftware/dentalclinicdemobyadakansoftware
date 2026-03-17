"use client";

import { useState, useActionState, startTransition, useEffect } from "react";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import { createAppointmentAction, getAvailableSlotsAction } from "@/actions/appointment";
import type { ServiceData, TimeSlot, ActionResult } from "@/types";

interface SpecialistItem {
  id: string; nameTr: string; nameEn: string; titleTr: string; titleEn: string;
  photoUrl: string;
  specialistServices: { serviceId: string }[];
}

interface Props {
  services: ServiceData[];
  specialists: SpecialistItem[];
  preselectedServiceId?: string;
  preselectedSpecialistId?: string;
}

const STEP_LABELS = ["step1", "step2", "step3", "step4"] as const;

const initialState: ActionResult = { success: false };

export default function AppointmentClient({ services, specialists, preselectedServiceId, preselectedSpecialistId }: Props) {
  const { lang } = useLang();

  const [step, setStep] = useState(preselectedServiceId ? (preselectedSpecialistId ? 3 : 2) : 1);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(
    services.find((s) => s.id === preselectedServiceId) ?? null
  );
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistItem | null>(
    specialists.find((s) => s.id === preselectedSpecialistId) ?? null
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [state, formAction, isPending] = useActionState(createAppointmentAction, initialState);

  // Filter specialists for selected service
  const availableSpecialists = selectedService
    ? specialists.filter((sp) => sp.specialistServices.some((ss) => ss.serviceId === selectedService.id))
    : specialists;

  // Load slots when date/specialist changes
  useEffect(() => {
    if (!selectedSpecialist || !selectedDate) { setSlots([]); return; }
    setSlotsLoading(true);
    void getAvailableSlotsAction(selectedSpecialist.id, selectedDate).then((s) => {
      setSlots(s);
      setSelectedSlot(null);
      setSlotsLoading(false);
    });
  }, [selectedSpecialist, selectedDate]);

  const today = new Date().toISOString().split("T")[0] ?? "";

  if (state.success) {
    return (
      <div className="py-24 text-center">
        <div className="max-w-md mx-auto px-4">
          <div className="text-5xl mb-6">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {lang === "tr" ? "Randevunuz Alındı!" : "Appointment Booked!"}
          </h2>
          <p className="text-gray-600">{t("appointment", "success", lang)}</p>
        </div>
      </div>
    );
  }

  const stepLabels = STEP_LABELS.map((k) => t("appointment", k, lang));

  return (
    <>
      <div className="py-12 text-white" style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark, #145470))" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">{t("appointment", "title", lang)}</h1>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${i + 1 === step ? "bg-white text-gray-900" : i + 1 < step ? "bg-white/30 text-white" : "bg-white/10 text-white/60"}`}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: i + 1 <= step ? "var(--color-accent)" : "transparent", border: "2px solid currentColor" }}>{i + 1}</span>
                  <span className="hidden sm:block">{label}</span>
                </div>
                {i < 3 && <span className="text-white/30">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        { state.error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{state.error}</div>
        )}

        {/* Step 1: Service */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t("appointment", "step1", lang)}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((svc) => (
                <button key={svc.id} onClick={() => { setSelectedService(svc); setStep(2); setSelectedSpecialist(null); }}
                  className={`card p-5 text-left transition-all ${selectedService?.id === svc.id ? "ring-2" : ""}`}
                  style={{ ringColor: "var(--color-primary)" }}>
                  <div className="text-3xl mb-3">🦷</div>
                  <p className="font-semibold text-gray-900">{lang === "tr" ? svc.nameTr : svc.nameEn}</p>
                  <p className="text-sm text-gray-500 mt-1">{lang === "tr" ? svc.shortDescTr : svc.shortDescEn}</p>
                  <p className="text-xs text-gray-400 mt-2">{svc.durationMinutes} {t("services", "minutes", lang)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Specialist */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t("appointment", "step2", lang)}</h2>
            {availableSpecialists.length === 0 ? (
              <p className="text-gray-500">{t("appointment", "noSpecialists", lang)}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableSpecialists.map((sp) => (
                  <button key={sp.id} onClick={() => { setSelectedSpecialist(sp); setStep(3); setSelectedDate(""); setSelectedSlot(null); }}
                    className={`card p-5 text-left flex items-center gap-4 ${selectedSpecialist?.id === sp.id ? "ring-2" : ""}`}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ background: "var(--color-primary-light)" }}>
                      {sp.photoUrl ? <img src={sp.photoUrl} alt={sp.nameTr} className="w-full h-full rounded-full object-cover" /> : "👨‍⚕️"}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{lang === "tr" ? sp.nameTr : sp.nameEn}</p>
                      <p className="text-xs text-gray-500">{lang === "tr" ? sp.titleTr : sp.titleEn}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setStep(1)} className="mt-6 text-sm text-gray-500 hover:text-gray-700">← {t("appointment", "back", lang)}</button>
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t("appointment", "step3", lang)}</h2>
            <div className="mb-6">
              <label className="form-label">{t("appointment", "date", lang)}</label>
              <input
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input max-w-xs"
              />
            </div>

            {selectedDate && (
              <div>
                <label className="form-label">{t("appointment", "time", lang)}</label>
                {slotsLoading ? (
                  <p className="text-gray-500 text-sm">{t("common", "loading", lang)}</p>
                ) : slots.length === 0 ? (
                  <p className="text-gray-500 text-sm">{t("appointment", "noSlots", lang)}</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.startTime}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${
                          !slot.available ? "opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400" :
                          selectedSlot?.startTime === slot.startTime ? "text-white border-transparent" : "border-gray-200 text-gray-700 hover:border-gray-400"
                        }`}
                        style={selectedSlot?.startTime === slot.startTime ? { background: "var(--color-primary)", borderColor: "var(--color-primary)" } : {}}>
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-gray-700">← {t("appointment", "back", lang)}</button>
              <button
                onClick={() => setStep(4)}
                disabled={!selectedSlot}
                className="btn-primary ml-auto disabled:opacity-50 disabled:cursor-not-allowed">
                {t("appointment", "next", lang)} →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Personal Info */}
        {step === 4 && selectedService && selectedSpecialist && selectedSlot && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t("appointment", "step4", lang)}</h2>

            {/* Summary */}
            <div className="card p-5 mb-6 text-sm space-y-2 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">{t("appointment", "summary", lang)}</h3>
              <div className="flex justify-between"><span className="text-gray-500">{t("appointment", "service", lang)}</span><span className="font-medium">{lang === "tr" ? selectedService.nameTr : selectedService.nameEn}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t("appointment", "specialist", lang)}</span><span className="font-medium">{lang === "tr" ? selectedSpecialist.nameTr : selectedSpecialist.nameEn}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t("appointment", "date", lang)}</span><span className="font-medium">{new Date(selectedDate).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t("appointment", "time", lang)}</span><span className="font-medium">{selectedSlot.startTime} - {selectedSlot.endTime}</span></div>
            </div>

            <form action={(fd) => { startTransition(() => { void formAction(fd); }); }} className="space-y-4">
              <input type="hidden" name="serviceId" value={selectedService.id} />
              <input type="hidden" name="specialistId" value={selectedSpecialist.id} />
              <input type="hidden" name="date" value={selectedDate} />
              <input type="hidden" name="startTime" value={selectedSlot.startTime} />
              <input type="hidden" name="endTime" value={selectedSlot.endTime} />
              <input type="hidden" name="patientLanguage" value={lang.toUpperCase()} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t("appointment", "name", lang)} *</label>
                  <input name="patientName" className="form-input" required minLength={2} />
                </div>
                <div>
                  <label className="form-label">{t("appointment", "phone", lang)} *</label>
                  <input name="patientPhone" type="tel" className="form-input" required />
                </div>
              </div>
              <div>
                <label className="form-label">{t("appointment", "email", lang)}</label>
                <input name="patientEmail" type="email" className="form-input" />
              </div>
              <div>
                <label className="form-label">{t("appointment", "note", lang)}</label>
                <textarea name="patientNote" className="form-input min-h-[80px]" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-gray-700">
                  ← {t("appointment", "back", lang)}
                </button>
                <button type="submit" disabled={isPending} className="btn-primary ml-auto">
                  {isPending ? t("common", "loading", lang) : t("appointment", "confirm", lang)}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
