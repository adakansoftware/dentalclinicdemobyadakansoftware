import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { sanitizeAssetReference } from "@/lib/upload-assets";
import type { SiteSettings } from "@/types";

const LEGACY_BRAND_MARKERS = ["dentacare", "diş kliniği", "dis klinigi", "dental clinic"];

const LEGACY_COPY_MARKERS = [
  "sağlıklı bir gülüş için doğru adres",
  "saglikli bir gulus icin dogru adres",
  "the right address for a healthy smile",
  "uzman ekibimiz ve modern teknolojimizle",
  "we offer the best dental care with our expert team and modern technology",
  "gaziantep'in en güvenilir diş kliniği",
  "gaziantep'in en guvenilir dis klinigi",
  "gaziantep dental clinic",
  "2010 yılından bu yana gaziantep'te",
  "2010 yilindan bu yana gaziantep'te",
  "has been providing dental health services in gaziantep since 2010",
];

export const DEMO_CLINIC_PROFILE = {
  clinicName: "Adakan Dental Klinik",
  clinicNameEn: "Adakan Dental Clinic",
  phone: "+90 539 941 65 21",
  whatsapp: "+90 539 941 65 21",
  email: "info@adakandental.com",
  address: "İncilipınar Mah., Şehitkamil / Gaziantep",
  addressEn: "Incilipinar Mah., Sehitkamil / Gaziantep",
  instagram: "https://instagram.com/adakansoftware",
  facebook: "https://facebook.com/adakansoftware",
  twitter: "",
  heroTitleTr: "Sağlıklı, Estetik ve Güvenli Gülüşler İçin Modern Diş Kliniği",
  heroTitleEn: "Modern Dental Care for Healthy, Aesthetic, and Confident Smiles",
  heroSubtitleTr:
    "Uzman kadro, dijital randevu deneyimi ve kişiye özel tedavi planlarıyla ağız ve diş sağlığınız için yanınızdayız.",
  heroSubtitleEn:
    "We support your oral health with a specialist team, digital booking experience, and treatment plans tailored to each patient.",
  aboutTitleTr: "Adakan Dental Klinik Hakkında",
  aboutTitleEn: "About Adakan Dental Clinic",
  aboutTextTr:
    "Adakan Dental Klinik, muayeneden tedavi planlamasına kadar her adımda güven veren, sakin ve şeffaf bir hasta deneyimi sunmak için kurgulanmıştır. Kliniğimizde estetik diş hekimliği, implant planlaması, çocuk diş sağlığı ve koruyucu bakım süreçleri kişiye özel değerlendirme ile ele alınır.",
  aboutTextEn:
    "Adakan Dental Clinic is designed to deliver a calm, transparent, and reassuring patient experience from consultation to treatment planning. Aesthetic dentistry, implant planning, pediatric dentistry, and preventive care are all handled with individualized clinical evaluation.",
  seoTitleTr: "Adakan Dental Klinik | Modern Diş Kliniği Demo",
  seoTitleEn: "Adakan Dental Clinic | Modern Dental Clinic Demo",
  seoDescTr:
    "Diş klinikleri için modern, mobil uyumlu, online randevu destekli web sitesi demosu. Güven veren içerik yapısı ve premium klinik sunumu içerir.",
  seoDescEn:
    "A modern dental clinic website demo with mobile-first design, online appointment flow, and a premium clinic presentation.",
} as const;

export const DEFAULT_SETTINGS: SiteSettings = {
  ...DEMO_CLINIC_PROFILE,
  mapEmbedUrl: "",
  logoUrl: "",
  faviconUrl: "",
};

function normalizeForComparison(value?: string) {
  return (value ?? "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAnyMarker(value: string | undefined, markers: string[]) {
  const normalized = normalizeForComparison(value);
  return markers.some((marker) => normalized.includes(normalizeForComparison(marker)));
}

function hasLegacyClinicBrand(value?: string) {
  return includesAnyMarker(value, LEGACY_BRAND_MARKERS);
}

function hasLegacyClinicCopy(value?: string) {
  return includesAnyMarker(value, LEGACY_COPY_MARKERS);
}

function resolveBrandText(value: string | undefined, fallback: string) {
  if (!value || hasLegacyClinicBrand(value) || hasLegacyClinicCopy(value)) {
    return fallback;
  }

  return value;
}

function resolveBrandSocialUrl(value: string | undefined, fallback: string) {
  if (!value || hasLegacyClinicBrand(value)) {
    return fallback;
  }

  return value;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await safeQuery("site settings", () => prisma.siteSetting.findMany(), []);
  const map: Record<string, string> = {};

  for (const row of rows) {
    map[row.key] = row.value;
  }

  return {
    clinicName: resolveBrandText(map.clinicName, DEFAULT_SETTINGS.clinicName),
    clinicNameEn: resolveBrandText(map.clinicNameEn, DEFAULT_SETTINGS.clinicNameEn),
    phone: map.phone ?? DEFAULT_SETTINGS.phone,
    whatsapp: map.whatsapp ?? DEFAULT_SETTINGS.whatsapp,
    email: resolveBrandText(map.email, DEFAULT_SETTINGS.email),
    address: resolveBrandText(map.address, DEFAULT_SETTINGS.address),
    addressEn: resolveBrandText(map.addressEn, DEFAULT_SETTINGS.addressEn),
    mapEmbedUrl: map.mapEmbedUrl ?? DEFAULT_SETTINGS.mapEmbedUrl,
    instagram: resolveBrandSocialUrl(map.instagram, DEFAULT_SETTINGS.instagram),
    facebook: resolveBrandSocialUrl(map.facebook, DEFAULT_SETTINGS.facebook),
    twitter: map.twitter ?? DEFAULT_SETTINGS.twitter,
    heroTitleTr: resolveBrandText(map.heroTitleTr, DEFAULT_SETTINGS.heroTitleTr),
    heroTitleEn: resolveBrandText(map.heroTitleEn, DEFAULT_SETTINGS.heroTitleEn),
    heroSubtitleTr: resolveBrandText(map.heroSubtitleTr, DEFAULT_SETTINGS.heroSubtitleTr),
    heroSubtitleEn: resolveBrandText(map.heroSubtitleEn, DEFAULT_SETTINGS.heroSubtitleEn),
    aboutTitleTr: resolveBrandText(map.aboutTitleTr, DEFAULT_SETTINGS.aboutTitleTr),
    aboutTitleEn: resolveBrandText(map.aboutTitleEn, DEFAULT_SETTINGS.aboutTitleEn),
    aboutTextTr: resolveBrandText(map.aboutTextTr, DEFAULT_SETTINGS.aboutTextTr),
    aboutTextEn: resolveBrandText(map.aboutTextEn, DEFAULT_SETTINGS.aboutTextEn),
    seoTitleTr: resolveBrandText(map.seoTitleTr, DEFAULT_SETTINGS.seoTitleTr),
    seoTitleEn: resolveBrandText(map.seoTitleEn, DEFAULT_SETTINGS.seoTitleEn),
    seoDescTr: resolveBrandText(map.seoDescTr, DEFAULT_SETTINGS.seoDescTr),
    seoDescEn: resolveBrandText(map.seoDescEn, DEFAULT_SETTINGS.seoDescEn),
    logoUrl: sanitizeAssetReference(map.logoUrl, DEFAULT_SETTINGS.logoUrl),
    faviconUrl: sanitizeAssetReference(map.faviconUrl, DEFAULT_SETTINGS.faviconUrl),
  };
}
