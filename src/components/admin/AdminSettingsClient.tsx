"use client";

import Image from "next/image";
import { useActionState, startTransition, useEffect, useState } from "react";
import { updateSettingsAction } from "@/actions/settings";
import { getGoogleMapsEmbedError } from "@/lib/maps";
import type { ActionResult, SiteSettings } from "@/types";

const initialState: ActionResult = { success: false };

interface Props {
  settings: SiteSettings;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-4 p-6">
      <h2 className="border-b border-gray-100 pb-3 text-lg font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  placeholder?: string;
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

function AssetField({
  label,
  value,
  onChange,
  fileError,
  setFileError,
  previewClassName,
  accept,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fileError: string;
  setFileError: (value: string) => void;
  previewClassName: string;
  accept?: string;
}) {
  useEffect(() => {
    setFileError("");
  }, [setFileError]);

  return (
    <div className="space-y-3">
      <label className="form-label">{label}</label>
      <input
        type="file"
        accept={accept ?? "image/*"}
        className="form-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;

          if (file.size > 2 * 1024 * 1024) {
            setFileError("Görsel en fazla 2 MB olabilir.");
            event.target.value = "";
            return;
          }

          setFileError("");
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") {
              onChange(reader.result);
            }
          };
          reader.readAsDataURL(file);
        }}
      />

      {fileError ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{fileError}</div> : null}

      {value ? (
        <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${previewClassName}`}>
          <Image src={value} alt={`${label} önizleme`} fill sizes="192px" className="object-contain" unoptimized />
        </div>
      ) : (
        <div className={`grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-400 ${previewClassName}`}>
          Önizleme
        </div>
      )}

      <button type="button" onClick={() => onChange("")} className="text-xs font-medium text-slate-500 hover:text-slate-800">
        Görseli kaldır
      </button>
    </div>
  );
}

export default function AdminSettingsClient({ settings }: Props) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, initialState);
  const [logoValue, setLogoValue] = useState(settings.logoUrl);
  const [faviconValue, setFaviconValue] = useState(settings.faviconUrl);
  const [mapEmbedUrl, setMapEmbedUrl] = useState(settings.mapEmbedUrl);
  const [logoError, setLogoError] = useState("");
  const [faviconError, setFaviconError] = useState("");
  const mapEmbedError = getGoogleMapsEmbedError(mapEmbedUrl);

  useEffect(() => {
    setLogoValue(settings.logoUrl);
    setFaviconValue(settings.faviconUrl);
    setMapEmbedUrl(settings.mapEmbedUrl);
    setLogoError("");
    setFaviconError("");
  }, [settings]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Site Ayarları</h1>

      {state.error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</div> : null}
      {state.success ? <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Ayarlar kaydedildi</div> : null}

      <form
        action={(fd) => {
          fd.set("logoUrl", logoValue);
          fd.set("faviconUrl", faviconValue);
          fd.set("mapEmbedUrl", mapEmbedUrl);
          startTransition(() => {
            void formAction(fd);
          });
        }}
        className="space-y-6"
      >
        <Section title="Klinik Bilgileri">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Klinik Adı (TR)" name="clinicName" defaultValue={settings.clinicName} />
            <Field label="Klinik Adı (EN)" name="clinicNameEn" defaultValue={settings.clinicNameEn} />
            <Field label="Telefon" name="phone" defaultValue={settings.phone} placeholder="+90 539 941 65 21" />
            <Field label="WhatsApp" name="whatsapp" defaultValue={settings.whatsapp} placeholder="+90 539 941 65 21" />
            <Field label="E-posta" name="email" defaultValue={settings.email} type="email" />
          </div>
          <Field label="Adres (TR)" name="address" defaultValue={settings.address} />
          <Field label="Adres (EN)" name="addressEn" defaultValue={settings.addressEn} />
          <div>
            <label className="form-label">Google Maps Embed URL</label>
            <input
              name="mapEmbedUrl"
              value={mapEmbedUrl}
              onChange={(event) => setMapEmbedUrl(event.target.value)}
              className="form-input"
              placeholder="https://www.google.com/maps/embed?..."
            />
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Yalnızca Google Maps içindeki <strong>Harita yerleştir</strong> adımından gelen <code>maps/embed</code> bağlantısını kullanın. Link boş bırakılırsa ya da geçersiz olursa sitede güvenli placeholder görünür.
            </p>
            {mapEmbedError ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {mapEmbedError}
              </div>
            ) : null}
          </div>
        </Section>

        <Section title="Sosyal Medya">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Instagram URL" name="instagram" defaultValue={settings.instagram} placeholder="https://instagram.com/..." />
            <Field label="Facebook URL" name="facebook" defaultValue={settings.facebook} placeholder="https://facebook.com/..." />
            <Field label="Twitter / X URL" name="twitter" defaultValue={settings.twitter} placeholder="https://twitter.com/..." />
          </div>
        </Section>

        <Section title="Hero Bölümü">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Başlık (TR)" name="heroTitleTr" defaultValue={settings.heroTitleTr} />
            <Field label="Başlık (EN)" name="heroTitleEn" defaultValue={settings.heroTitleEn} />
            <Field label="Alt Başlık (TR)" name="heroSubtitleTr" defaultValue={settings.heroSubtitleTr} type="textarea" />
            <Field label="Alt Başlık (EN)" name="heroSubtitleEn" defaultValue={settings.heroSubtitleEn} type="textarea" />
          </div>
        </Section>

        <Section title="Hakkımızda">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Başlık (TR)" name="aboutTitleTr" defaultValue={settings.aboutTitleTr} />
            <Field label="Başlık (EN)" name="aboutTitleEn" defaultValue={settings.aboutTitleEn} />
            <Field label="İçerik (TR)" name="aboutTextTr" defaultValue={settings.aboutTextTr} type="textarea" />
            <Field label="İçerik (EN)" name="aboutTextEn" defaultValue={settings.aboutTextEn} type="textarea" />
          </div>
        </Section>

        <Section title="SEO Meta">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Sayfa Başlığı (TR)" name="seoTitleTr" defaultValue={settings.seoTitleTr} />
            <Field label="Sayfa Başlığı (EN)" name="seoTitleEn" defaultValue={settings.seoTitleEn} />
            <Field label="Meta Açıklama (TR)" name="seoDescTr" defaultValue={settings.seoDescTr} type="textarea" />
            <Field label="Meta Açıklama (EN)" name="seoDescEn" defaultValue={settings.seoDescEn} type="textarea" />
          </div>
        </Section>

        <Section title="Marka Varlıkları">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <AssetField
              label="Logo Yükle"
              value={logoValue}
              onChange={setLogoValue}
              fileError={logoError}
              setFileError={setLogoError}
              previewClassName="h-36 w-44"
            />
            <AssetField
              label="Favicon Yükle"
              value={faviconValue}
              onChange={setFaviconValue}
              fileError={faviconError}
              setFileError={setFaviconError}
              previewClassName="h-24 w-24"
              accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/webp,image/jpeg"
            />
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
