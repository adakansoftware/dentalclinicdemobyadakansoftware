import type { Metadata } from "next";
import FAQClient from "@/components/public/FAQClient";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";
import { buildPublicPageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";
import type { FAQData } from "@/types";

export const revalidate = 60;
export const dynamic = "force-dynamic";

const FAQ_TR_FALLBACKS: Record<string, string> = {
  "Randevumu iptal edebilir miyim?":
    "Randevunuzu iptal etmek için telefon, WhatsApp veya online randevu sayfasındaki iptal formu aracılığıyla kliniğimizle iletişime geçebilirsiniz.",
  "Tedavi ücretleri ve ödeme seçenekleri hakkında nasıl bilgi alabilirim?":
    "Tedavi ücretleri muayene sonrası kişisel değerlendirmeye göre belirlenmektedir. Detaylı bilgi için kliniğimizi arayabilir veya WhatsApp üzerinden yazabilirsiniz.",
  "Diş beyazlatma kalıcı mıdır?":
    "Diş beyazlatma etkisi kişiden kişiye farklılık gösterir. Ortalama 6 ay ile 2 yıl arasında sürebilir; düzenli ağız bakımı ile bu süre uzatılabilir.",
  "İmplant tedavisi ağrılı mıdır?":
    "İmplant tedavisi lokal anestezi altında uygulandığı için işlem sırasında ağrı hissedilmez. İşlem sonrası hafif bir hassasiyet normal olup birkaç gün içinde geçer.",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return buildPublicPageMetadata({
    settings,
    title: `Sık Sorulan Sorular | ${settings.clinicName}`,
    description: `${settings.clinicName} hakkında en sık sorulan sorular ve yanıtları.`,
    path: "/faq",
  });
}

export default async function FAQPage() {
  const rows = await safeQuery(
    "faq list",
    () => prisma.fAQItem.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    []
  );
  const faqs: FAQData[] = rows.map((faq) => ({
    id: faq.id,
    questionTr: faq.questionTr,
    questionEn: faq.questionEn,
    answerTr: faq.answerTr?.trim() || FAQ_TR_FALLBACKS[faq.questionTr] || "",
    answerEn: faq.answerEn,
    order: faq.order,
    isActive: faq.isActive,
  }));

  return <FAQClient faqs={faqs} />;
}
