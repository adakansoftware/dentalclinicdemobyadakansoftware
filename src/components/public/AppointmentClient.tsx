"use client";

import Image from "next/image";
import { startTransition, useActionState, useEffect, useState } from "react";
import {
  cancelAppointmentByPhoneAction,
  createAppointmentAction,
  getAvailableSlotsAction,
  lookupAppointmentsByPhoneAction,
} from "@/actions/appointment";
import SpamProtectionFields from "@/components/shared/SpamProtectionFields";
import PageHero from "@/components/shared/PageHero";
import { useLang } from "@/context/LangContext";
import { t } from "@/lib/translations";
import type { ActionResult, ServiceData, TimeSlot } from "@/types";

interface SpecialistItem {
  id: string;
  nameTr: string;
  nameEn: string;
  titleTr: string;
  titleEn: string;
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
const cancelInitialState: ActionResult = { success: false };
const lookupInitialState: ActionResult<
  {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
    serviceName: string;
    specialistName: string;
  }[]
> = { success: false };

function getPublicStatusMeta(
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED",
  lang: "tr" | "en"
) {
  if (lang === "tr") {
    switch (status) {
      case "CANCELLED":
        return { label: "İptal Edildi", className: "bg-red-50 text-red-700 border border-red-200" };
      case "COMPLETED":
        return { label: "Tamamlandı", className: "bg-slate-100 text-slate-700 border border-slate-200" };
      default:
        return { label: "Aktif", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
    }
  }

  switch (status) {
    case "CANCELLED":
      return { label: "Cancelled", className: "bg-red-50 text-red-700 border border-red-200" };
    case "COMPLETED":
      return { label: "Completed", className: "bg-slate-100 text-slate-700 border border-slate-200" };
    default:
      return { label: "Active", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

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
  ].filter(Boolean) as { label: string; value: string }[];

  const assurancePoints = [
    lang === "tr"
      ? "Seçtiğiniz tarih ve saat, uzmanın çalışma planına göre listelenir."
      : "Available times are listed based on the specialist's schedule.",
    lang === "tr"
      ? "Randevu talebiniz klinik ekibimiz tarafından en kısa sürede değerlendirilir."
      : "Your request is reviewed by our clinic team as soon as possible.",
    lang === "tr"
      ? "Bilgileriniz yalnızca randevu planlaması için kullanılır."
      : "Your details are used only for appointment planning.",
  ];

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
                <div className="step-shell p-6 md:p-8">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="step-badge">01</div>
                    <h2 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
                      {t("appointment", "step1", lang)}
                    </h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => {
                          setSelectedService(service);
                          setSelectedSpecialist(null);
                          setSelectedDate("");
                          setSelectedSlot(null);
                          setStep(2);
                        }}
                        className={`selection-card flex min-h-[172px] w-full flex-col items-start overflow-hidden p-5 text-left ${
                          selectedService?.id === service.id ? "selection-card--active" : ""
                        }`}
                      >
                        <div className="service-chip w-fit">
                          {service.durationMinutes} {t("services", "minutes", lang)}
                        </div>
                        <div className="mt-4 text-[1.05rem] font-semibold leading-tight text-[color:var(--text-primary)] md:text-[1.12rem]">
                          {lang === "tr" ? service.nameTr : service.nameEn}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)] break-words">
                          {lang === "tr" ? service.shortDescTr : service.shortDescEn}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="step-shell p-6 md:p-8">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="step-badge">02</div>
                    <h2 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
                      {t("appointment", "step2", lang)}
                    </h2>
                  </div>

                  {availableSpecialists.length === 0 ? (
                    <p className="text-[color:var(--text-secondary)]">{t("appointment", "noSpecialists", lang)}</p>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {availableSpecialists.map((specialist) => (
                        <button
                          key={specialist.id}
                          onClick={() => {
                            setSelectedSpecialist(specialist);
                            setSelectedDate("");
                            setSelectedSlot(null);
                            setStep(3);
                          }}
                          className={`selection-card flex min-h-[112px] w-full items-center gap-4 overflow-hidden p-5 text-left ${
                            selectedSpecialist?.id === specialist.id ? "selection-card--active" : ""
                          }`}
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[color:var(--surface-muted)]">
                            {specialist.photoUrl ? (
                              <Image
                                src={specialist.photoUrl}
                                alt={lang === "tr" ? specialist.nameTr : specialist.nameEn}
                                width={64}
                                height={64}
                                sizes="64px"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--accent-main)]">
                                {getInitials(lang === "tr" ? specialist.nameTr : specialist.nameEn)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[1.02rem] font-semibold leading-tight text-[color:var(--text-primary)]">
                              {lang === "tr" ? specialist.nameTr : specialist.nameEn}
                            </div>
                            <div className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)] break-words">
                              {lang === "tr" ? specialist.titleTr : specialist.titleEn}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <button onClick={() => setStep(1)} className="mt-6 text-sm text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]">
                    <span aria-hidden="true">←</span> {t("appointment", "back", lang)}
                  </button>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="step-shell p-6 md:p-8">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="step-badge">03</div>
                    <h2 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
                      {t("appointment", "step3", lang)}
                    </h2>
                  </div>

                  <div className="mb-6 max-w-xs">
                    <label className="form-label">{t("appointment", "date", lang)}</label>
                    <input
                      type="date"
                      min={today}
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                      className="form-input"
                    />
                  </div>

                  {selectedDate ? (
                    <div>
                      <label className="form-label">{t("appointment", "time", lang)}</label>
                      {slotsLoading ? (
                        <p className="text-sm text-[color:var(--text-secondary)]">{t("common", "loading", lang)}</p>
                      ) : slots.length === 0 ? (
                        <p className="text-sm text-[color:var(--text-secondary)]">{t("appointment", "noSlots", lang)}</p>
                      ) : (
                        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                          {slots.map((slot) => (
                            <button
                              key={slot.startTime}
                              disabled={!slot.available}
                              onClick={() => setSelectedSlot(slot)}
                              className={`slot-card ${
                                !slot.available
                                  ? "slot-card--disabled"
                                  : selectedSlot?.startTime === slot.startTime
                                    ? "slot-card--active"
                                    : ""
                              }`}
                            >
                              {slot.startTime}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button onClick={() => setStep(2)} className="text-sm text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]">
                      <span aria-hidden="true">←</span> {t("appointment", "back", lang)}
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      disabled={!selectedSlot}
                      className="btn-primary sm:ml-auto disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t("appointment", "next", lang)} <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 4 && selectedService && selectedSpecialist && selectedSlot ? (
                <div className="step-shell p-6 md:p-8">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="step-badge">04</div>
                    <h2 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
                      {t("appointment", "step4", lang)}
                    </h2>
                  </div>

                  <form
                    action={(formData) => {
                      startTransition(() => {
                        void formAction(formData);
                      });
                    }}
                    className="space-y-4"
                  >
                    <SpamProtectionFields />
                    <input type="hidden" name="serviceId" value={selectedService.id} />
                    <input type="hidden" name="specialistId" value={selectedSpecialist.id} />
                    <input type="hidden" name="date" value={selectedDate} />
                    <input type="hidden" name="startTime" value={selectedSlot.startTime} />
                    <input type="hidden" name="endTime" value={selectedSlot.endTime} />
                    <input type="hidden" name="patientLanguage" value={lang.toUpperCase()} />

                    <div className="grid gap-4 sm:grid-cols-2">
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
                      <textarea name="patientNote" className="form-input min-h-[110px]" />
                    </div>

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
                      <button type="button" onClick={() => setStep(3)} className="text-sm text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)]">
                        <span aria-hidden="true">←</span> {t("appointment", "back", lang)}
                      </button>
                      <button type="submit" disabled={isPending} className="btn-primary sm:ml-auto">
                        {isPending ? t("common", "loading", lang) : t("appointment", "confirm", lang)}
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}
            </div>

            <div className="space-y-6 lg:sticky lg:top-28">
              <div className="surface-panel p-6">
                <h3 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
                  {lang === "tr" ? "Seçimleriniz" : "Your selections"}
                </h3>
                {summaryRows.length === 0 ? (
                  <p className="mt-4 text-sm leading-relaxed text-[color:var(--text-secondary)]">
                    {lang === "tr" ? "Seçimleriniz burada özet olarak görünecektir." : "Your selections will appear here as a summary."}
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {summaryRows.map((row) => (
                      <div key={row.label} className="summary-row">
                        <span className="text-[color:var(--text-secondary)]">{row.label}</span>
                        <span className="ml-6 text-right font-semibold text-[color:var(--text-primary)]">{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="surface-panel p-6">
                <h3 className="mb-4 text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
                  {lang === "tr" ? "Bilgilendirme" : "Information"}
                </h3>
                <div className="space-y-3 text-sm leading-relaxed text-[color:var(--text-secondary)]">
                  <p>
                    {lang === "tr"
                      ? "Online form bir randevu talebi oluşturur. Klinik ekibi değerlendirme sonrasında sizinle iletişime geçer."
                      : "The online form creates an appointment request. Our team will contact you after review."}
                  </p>
                  <p>
                    {lang === "tr"
                      ? "Uygun saatler, uzmanın çalışma planına göre otomatik olarak listelenir."
                      : "Available time slots are listed automatically based on the specialist's schedule."}
                  </p>
                </div>

                <div className="mt-5 space-y-3 rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                  {assurancePoints.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[color:var(--text-secondary)]">
                      <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[color:var(--accent-main)]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="surface-panel p-6">
                <h3 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
                  {lang === "tr" ? "Randevularımı Görüntüle" : "View My Appointments"}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--text-secondary)]">
                  {lang === "tr"
                    ? "Ad-soyad ve telefon numaranız ile yaklaşan randevularınızı görüntüleyebilirsiniz."
                    : "View your upcoming appointments with your full name and phone number."}
                </p>

                {lookupState.error ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{lookupState.error}</div>
                ) : null}
                {lookupState.success && lookupState.message ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{lookupState.message}</div>
                ) : null}

                <form
                  action={(formData) => {
                    startTransition(() => {
                      void lookupFormAction(formData);
                    });
                  }}
                  className="mt-5 space-y-4"
                >
                  <SpamProtectionFields />
                  <input type="hidden" name="patientLanguage" value={lang.toUpperCase()} />

                  <div>
                    <label className="form-label">{t("appointment", "name", lang)} *</label>
                    <input name="patientName" className="form-input" required minLength={2} />
                  </div>
                  <div>
                    <label className="form-label">{t("appointment", "phone", lang)} *</label>
                    <input name="patientPhone" type="tel" className="form-input" required />
                  </div>

                  <button type="submit" disabled={isLookupPending} className="btn-ghost w-full">
                    {isLookupPending ? t("common", "loading", lang) : lang === "tr" ? "Telefon ile Randevularımı Getir" : "Find My Appointments"}
                  </button>
                </form>

                {lookupState.success && lookupState.data?.length ? (
                  <div className="mt-5 space-y-3">
                    {lookupState.data.map((appointment) => (
                      <div key={appointment.id} className="summary-row">
                        <div>
                          <div className="font-semibold text-[color:var(--text-primary)]">{appointment.serviceName}</div>
                          <div className="mt-1 text-xs text-[color:var(--text-secondary)]">{appointment.specialistName}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-[color:var(--text-primary)]">
                            {appointment.date} / {appointment.startTime}
                          </div>
                          <div className="mt-2 flex justify-end">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getPublicStatusMeta(appointment.status, lang).className}`}
                            >
                              {getPublicStatusMeta(appointment.status, lang).label}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="surface-panel p-6">
                <h3 className="text-2xl font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]">
                  {lang === "tr" ? "Randevu İptali" : "Cancel Appointment"}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--text-secondary)]">
                  {lang === "tr"
                    ? "Ad-soyad, telefon numarası ve randevu tarihiniz ile kayıtlı aktif randevunuzu iptal edebilirsiniz."
                    : "Cancel your active appointment using your full name, phone number, and appointment date."}
                </p>

                {cancelState.error ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{cancelState.error}</div>
                ) : null}
                {cancelState.success && cancelState.message ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{cancelState.message}</div>
                ) : null}

                <form
                  action={(formData) => {
                    startTransition(() => {
                      void cancelFormAction(formData);
                    });
                  }}
                  className="mt-5 space-y-4"
                >
                  <SpamProtectionFields />
                  <input type="hidden" name="patientLanguage" value={lang.toUpperCase()} />

                  <div>
                    <label className="form-label">{t("appointment", "name", lang)} *</label>
                    <input name="patientName" className="form-input" required minLength={2} />
                  </div>
                  <div>
                    <label className="form-label">{t("appointment", "phone", lang)} *</label>
                    <input name="patientPhone" type="tel" className="form-input" required />
                  </div>
                  <div>
                    <label className="form-label">{t("appointment", "date", lang)} *</label>
                    <input name="date" type="date" min={today} className="form-input" required />
                  </div>

                  <button type="submit" disabled={isCancelPending} className="btn-outline w-full">
                    {isCancelPending ? t("common", "loading", lang) : lang === "tr" ? "Telefon ile Randevu İptal Et" : "Cancel by Phone"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
