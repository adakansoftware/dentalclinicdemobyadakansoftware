"use client";

interface Props {
  lang: "tr" | "en";
}

export default function InfoPanel({ lang }: Props) {
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

  return (
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
  );
}
