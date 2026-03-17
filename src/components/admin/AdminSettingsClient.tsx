"use client";

import type { ActionResult } from "@/types";

import { useActionState, startTransition, useState } from "react";
import { updateSettingsAction } from "@/actions/settings";
import type { SiteSettings } from "@/types";

const initialState: ActionResult = { success: false };

interface Props { settings: SiteSettings; }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 space-y-4">
      <h2 className="font-semibold text-gray-900 text-lg border-b border-gray-100 pb-3">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, name, defaultValue, type = "text", placeholder }: {
  label: string; name: string; defaultValue: string; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {type === "textarea" ? (
        <textarea name={name} defaultValue={defaultValue} className="form-input min-h-[80px]" placeholder={placeholder} />
      ) : (
        <input name={name} type={type} defaultValue={defaultValue} className="form-input" placeholder={placeholder} />
      )}
    </div>
  );
}

function ColorField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  const [val, setVal] = useState(defaultValue);
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="flex gap-3 items-center">
        <input type="color" value={val} onChange={(e) => setVal(e.target.value)}
          className="h-10 w-16 rounded-lg border border-gray-200 cursor-pointer" />
        <input name={name} type="text" value={val} onChange={(e) => setVal(e.target.value)}
          className="form-input flex-1" />
      </div>
    </div>
  );
}

export default function AdminSettingsClient({ settings }: Props) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initialState);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Site Ayarları</h1>

      { state.error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{state.error}</div>
      )}
      { state.success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">✓ Ayarlar kaydedildi</div>
      )}

      <form action={(fd) => { startTransition(() => { void formAction(fd); }); }} className="space-y-6">
        <Section title="Klinik Bilgileri">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Klinik Adı (TR)" name="clinicName" defaultValue={settings.clinicName} />
            <Field label="Klinik Adı (EN)" name="clinicNameEn" defaultValue={settings.clinicNameEn} />
            <Field label="Telefon" name="phone" defaultValue={settings.phone} placeholder="+90 312 000 00 00" />
            <Field label="WhatsApp" name="whatsapp" defaultValue={settings.whatsapp} placeholder="+905320000000" />
            <Field label="E-posta" name="email" defaultValue={settings.email} type="email" />
          </div>
          <Field label="Adres (TR)" name="address" defaultValue={settings.address} />
          <Field label="Adres (EN)" name="addressEn" defaultValue={settings.addressEn} />
          <Field label="Google Maps Embed URL" name="mapEmbedUrl" defaultValue={settings.mapEmbedUrl} placeholder="https://www.google.com/maps/embed?..." />
        </Section>

        <Section title="Sosyal Medya">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Instagram URL" name="instagram" defaultValue={settings.instagram} placeholder="https://instagram.com/..." />
            <Field label="Facebook URL" name="facebook" defaultValue={settings.facebook} placeholder="https://facebook.com/..." />
            <Field label="Twitter/X URL" name="twitter" defaultValue={settings.twitter} placeholder="https://twitter.com/..." />
          </div>
        </Section>

        <Section title="Hero Bölümü">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Başlık (TR)" name="heroTitleTr" defaultValue={settings.heroTitleTr} />
            <Field label="Başlık (EN)" name="heroTitleEn" defaultValue={settings.heroTitleEn} />
            <Field label="Alt Başlık (TR)" name="heroSubtitleTr" defaultValue={settings.heroSubtitleTr} type="textarea" />
            <Field label="Alt Başlık (EN)" name="heroSubtitleEn" defaultValue={settings.heroSubtitleEn} type="textarea" />
          </div>
        </Section>

        <Section title="Hakkımızda">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Başlık (TR)" name="aboutTitleTr" defaultValue={settings.aboutTitleTr} />
            <Field label="Başlık (EN)" name="aboutTitleEn" defaultValue={settings.aboutTitleEn} />
            <Field label="İçerik (TR)" name="aboutTextTr" defaultValue={settings.aboutTextTr} type="textarea" />
            <Field label="İçerik (EN)" name="aboutTextEn" defaultValue={settings.aboutTextEn} type="textarea" />
          </div>
        </Section>

        <Section title="SEO Meta">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Sayfa Başlığı (TR)" name="seoTitleTr" defaultValue={settings.seoTitleTr} />
            <Field label="Sayfa Başlığı (EN)" name="seoTitleEn" defaultValue={settings.seoTitleEn} />
            <Field label="Meta Açıklama (TR)" name="seoDescTr" defaultValue={settings.seoDescTr} type="textarea" />
            <Field label="Meta Açıklama (EN)" name="seoDescEn" defaultValue={settings.seoDescEn} type="textarea" />
          </div>
        </Section>

        <Section title="Görünüm & Marka">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ColorField label="Ana Renk" name="primaryColor" defaultValue={settings.primaryColor} />
            <ColorField label="Vurgu Rengi" name="accentColor" defaultValue={settings.accentColor} />
            <Field label="Logo URL" name="logoUrl" defaultValue={settings.logoUrl} placeholder="https://..." />
            <Field label="Favicon URL" name="faviconUrl" defaultValue={settings.faviconUrl} placeholder="https://..." />
          </div>
        </Section>

        <div className="flex justify-end pb-8">
          <button type="submit" disabled={isPending} className="btn-primary px-10 py-3 text-base">
            {isPending ? "Kaydediliyor..." : "Tüm Ayarları Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
