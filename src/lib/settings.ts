import { prisma } from "@/lib/prisma";
import type { SiteSettings } from "@/types";

const DEFAULT_SETTINGS: SiteSettings = {
  clinicName: "DentaCare Kliniği",
  clinicNameEn: "DentaCare Clinic",
  phone: "+90 342 000 00 00",
  whatsapp: "+905320000000",
  email: "info@dentacare.com.tr",
  address: "Gaziantep, Türkiye",
  addressEn: "Gaziantep, Turkey",
  mapEmbedUrl: "",
  instagram: "",
  facebook: "",
  twitter: "",
  heroTitleTr: "Sağlıklı Bir Gülüş İçin Doğru Adres",
  heroTitleEn: "The Right Address for a Healthy Smile",
  heroSubtitleTr: "Uzman ekibimiz ile ağız ve diş sağlığınız için buradayız.",
  heroSubtitleEn: "We are here for your oral and dental health with our expert team.",
  aboutTitleTr: "Hakkımızda",
  aboutTitleEn: "About Us",
  aboutTextTr: "Kliniğimiz hakkında bilgi...",
  aboutTextEn: "About our clinic...",
  seoTitleTr: "DentaCare Kliniği",
  seoTitleEn: "DentaCare Clinic",
  seoDescTr: "Gaziantep diş kliniği",
  seoDescEn: "Gaziantep dental clinic",
  primaryColor: "#1a6b8a",
  accentColor: "#f0a500",
  logoUrl: "",
  faviconUrl: "",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await prisma.siteSetting.findMany();
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }

  return {
    clinicName: map.clinicName ?? DEFAULT_SETTINGS.clinicName,
    clinicNameEn: map.clinicNameEn ?? DEFAULT_SETTINGS.clinicNameEn,
    phone: map.phone ?? DEFAULT_SETTINGS.phone,
    whatsapp: map.whatsapp ?? DEFAULT_SETTINGS.whatsapp,
    email: map.email ?? DEFAULT_SETTINGS.email,
    address: map.address ?? DEFAULT_SETTINGS.address,
    addressEn: map.addressEn ?? DEFAULT_SETTINGS.addressEn,
    mapEmbedUrl: map.mapEmbedUrl ?? DEFAULT_SETTINGS.mapEmbedUrl,
    instagram: map.instagram ?? DEFAULT_SETTINGS.instagram,
    facebook: map.facebook ?? DEFAULT_SETTINGS.facebook,
    twitter: map.twitter ?? DEFAULT_SETTINGS.twitter,
    heroTitleTr: map.heroTitleTr ?? DEFAULT_SETTINGS.heroTitleTr,
    heroTitleEn: map.heroTitleEn ?? DEFAULT_SETTINGS.heroTitleEn,
    heroSubtitleTr: map.heroSubtitleTr ?? DEFAULT_SETTINGS.heroSubtitleTr,
    heroSubtitleEn: map.heroSubtitleEn ?? DEFAULT_SETTINGS.heroSubtitleEn,
    aboutTitleTr: map.aboutTitleTr ?? DEFAULT_SETTINGS.aboutTitleTr,
    aboutTitleEn: map.aboutTitleEn ?? DEFAULT_SETTINGS.aboutTitleEn,
    aboutTextTr: map.aboutTextTr ?? DEFAULT_SETTINGS.aboutTextTr,
    aboutTextEn: map.aboutTextEn ?? DEFAULT_SETTINGS.aboutTextEn,
    seoTitleTr: map.seoTitleTr ?? DEFAULT_SETTINGS.seoTitleTr,
    seoTitleEn: map.seoTitleEn ?? DEFAULT_SETTINGS.seoTitleEn,
    seoDescTr: map.seoDescTr ?? DEFAULT_SETTINGS.seoDescTr,
    seoDescEn: map.seoDescEn ?? DEFAULT_SETTINGS.seoDescEn,
    primaryColor: map.primaryColor ?? DEFAULT_SETTINGS.primaryColor,
    accentColor: map.accentColor ?? DEFAULT_SETTINGS.accentColor,
    logoUrl: map.logoUrl ?? DEFAULT_SETTINGS.logoUrl,
    faviconUrl: map.faviconUrl ?? DEFAULT_SETTINGS.faviconUrl,
  };
}
