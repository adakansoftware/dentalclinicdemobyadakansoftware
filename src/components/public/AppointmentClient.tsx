"use client";

import { useActionState, useEffect, useState } from "react";
import {
  cancelAppointmentByPhoneAction,
  createAppointmentAction,
  getAvailableSlotsAction,
  lookupAppointmentsByPhoneAction,
} from "@/actions/appointment";
import PageHero from "@/components/shared/PageHero";
import StepService from "@/components/public/appointment/StepService";
import StepSpecialist from "@/components/public/appointment/StepSpecialist";
import StepDateTime from "@/components/public/appointment/StepDateTime";
import StepComplaint from "@/components/public/appointment/StepComplaint";
import StepDetails from "@/components/public/appointment/StepDetails";
import SummaryPanel from "@/components/public/appointment/SummaryPanel";
import InfoPanel from "@/components/public/appointment/InfoPanel";
import LookupPanel from "@/components/public/appointment/LookupPanel";
import CancelPanel from "@/components/public/appointment/CancelPanel";
import type { SpecialistItem } from "@/components/public/appointment/types";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import type { ActionResult, PublicAppointmentLookupItem, ServiceData, TimeSlot } from "@/types";

interface Props {
  services: ServiceData[];
  specialists: SpecialistItem[];
  preselectedServiceId?: string;
  preselectedSpecialistId?: string;
}

const STEP_LABELS = ["step1", "step2", "step3", "step4", "step5"] as const;
const initialState: ActionResult = { success: false };
const cancelInitialState: ActionResult = { success: false };
const lookupInitialState: ActionResult<PublicAppointmentLookupItem[]> = { success: false };

export default function AppointmentClient({
  services,
  specialists,
  preselectedServiceId,
  preselectedSpecialistId,
}: Props) {
  const { lang } = useLang();

  const [step, setStep] = useState(preselectedServiceId ? (preselectedSpecialistId ? 3 : 2) : 1);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(
    services.find((service) => service.id === preselectedServiceId) ?? null
  );
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistItem | null>(
    specialists.find((specialist) => specialist.id === preselectedSpecialistId) ?? null
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [complaint, setComplaint] = useState("");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [state, formAction, isPending] = useActionState(createAppointmentAction, initialState);
  const [cancelState, cancelFormAction, isCancelPending] = useActionState(
    cancelAppointmentByPhoneAction,
    cancelInitialState
  );
  const [lookupState, lookupFormAction, isLookupPending] = useActionState(
    lookupAppointmentsByPhoneAction,
    lookupInitialState
  );

  const availableSpecialists = selectedService
    ? specialists.filter((specialist) =>
        specialist.specialistServices.some((specialistService) => specialistService.serviceId === selectedService.id)
      )
    : specialists;

  useEffect(() => {
    if (!selectedSpecialist || !selectedDate) {
      setSlots([]);
      return;
    }

    setSlotsLoading(true);
    void getAvailableSlotsAction(selectedSpecialist.id, selectedDate).then((availableSlots) => {
      setSlots(availableSlots);
      setSelectedSlot(null);
      setSlotsLoading(false);
    });
  }, [selectedDate, selectedSpecialist]);

  const today = new Date().toISOString().split("T")[0] ?? "";
  const stepLabels = STEP_LABELS.map((key) => t("appointment", key, lang));

  const summaryRows = [
    selectedService
      ? { label: t("appointment", "service", lang), value: lang === "tr" ? selectedService.nameTr : selectedService.nameEn }
      : null,
    selectedSpecialist
      ? { label: t("appointment", "specialist", lang), value: lang === "tr" ? selectedSpecialist.nameTr : selectedSpecialist.nameEn }
      : null,
    selectedDate
      ? {
          label: t("appointment", "date", lang),
          value: new Date(selectedDate).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        }
      : null,
    selectedSlot
      ? { label: t("appointment", "time", lang), value: `${selectedSlot.startTime} - ${selectedSlot.endTime}` }
      : null,
    complaint.trim()
      ? {
          label: t("appointment", "complaint", lang),
          value:
            complaint.trim().length > 60
              ? `${complaint.trim().slice(0, 60)}…`
              : complaint.trim(),
        }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  if (state.success) {
    return (
      <section className="section-block">
        <div className="section-shell">
          <div className="success-panel mx-auto max-w-xl">
            <h2 className="text-3xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
              {lang === "tr" ? "Randevu talebiniz alındı" : "Your appointment request has been received"}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[color:var(--text-secondary)]">
              {t("appointment", "success", lang)}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <PageHero
        kicker={lang === "tr" ? "Online Randevu" : "Online Appointment"}
        title={t("appointment", "title", lang)}
        subtitle={
          lang === "tr"
            ? "Hizmet, uzman, tarih ve saat seçimini net, düzenli ve sakin bir akışla tamamlayabilirsiniz."
            : "Choose service, specialist, date, and time through a clear, structured, and calm booking flow."
        }
        minimal
      >
        <div className="hero-panel hero-panel--compact p-5">
          <div className="space-y-3">
            {stepLabels.map((label, index) => {
              const active = index + 1 === step;
              const done = index + 1 < step;

              return (
                <div
                  key={label}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                    active
                      ? "bg-[rgba(85,145,183,0.12)] text-[color:var(--text-primary)]"
                      : done
                        ? "bg-[color:var(--surface-muted)] text-[color:var(--text-primary)]"
                        : "bg-[color:var(--surface-muted)] text-[color:var(--text-secondary)] opacity-70"
                  }`}
                >
                  <span className="step-badge">{String(index + 1).padStart(2, "0")}</span>
                  <span className={`text-sm ${active ? "font-bold" : "font-medium"}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </PageHero>

      <section className="section-block">
        <div className="section-shell">
          <div className="grid items-start gap-8 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              {state.error ? (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {state.error}
                </div>
              ) : null}

              {step === 1 ? (
                <StepService
                  lang={lang}
                  services={services}
                  selectedServiceId={selectedService?.id}
                  onSelect={(service) => {
                    setSelectedService(service);
                    setSelectedSpecialist(null);
                    setSelectedDate("");
                    setSelectedSlot(null);
                    setStep(2);
                  }}
                />
              ) : null}

              {step === 2 ? (
                <StepSpecialist
                  lang={lang}
                  specialists={availableSpecialists}
                  selectedSpecialistId={selectedSpecialist?.id}
                  onSelect={(specialist) => {
                    setSelectedSpecialist(specialist);
                    setSelectedDate("");
                    setSelectedSlot(null);
                    setStep(3);
                  }}
                  onBack={() => setStep(1)}
                />
              ) : null}

              {step === 3 ? (
                <StepDateTime
                  lang={lang}
                  today={today}
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  slots={slots}
                  slotsLoading={slotsLoading}
                  onDateChange={setSelectedDate}
                  onSlotSelect={setSelectedSlot}
                  onBack={() => setStep(2)}
                  onNext={() => setStep(4)}
                />
              ) : null}

              {step === 4 ? (
                <StepComplaint
                  lang={lang}
                  complaint={complaint}
                  onChange={setComplaint}
                  onBack={() => setStep(3)}
                  onNext={() => setStep(5)}
                />
              ) : null}

              {step === 5 && selectedService && selectedSpecialist && selectedSlot ? (
                <StepDetails
                  lang={lang}
                  selectedService={selectedService}
                  selectedSpecialist={selectedSpecialist}
                  selectedDate={selectedDate}
                  selectedSlot={selectedSlot}
                  complaint={complaint}
                  isPending={isPending}
                  formAction={formAction}
                  onBack={() => setStep(4)}
                />
              ) : null}
            </div>

            <div className="space-y-6 lg:sticky lg:top-28">
              <SummaryPanel lang={lang} summaryRows={summaryRows} />
              <InfoPanel lang={lang} />
              <LookupPanel lang={lang} lookupState={lookupState} isLookupPending={isLookupPending} lookupFormAction={lookupFormAction} />
              <CancelPanel lang={lang} today={today} cancelState={cancelState} isCancelPending={isCancelPending} cancelFormAction={cancelFormAction} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
