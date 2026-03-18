import { prisma } from "@/lib/prisma";
import FAQClient from "@/components/public/FAQClient";
import type { FAQData } from "@/types";

export const revalidate = 60;

export default async function FAQPage() {
  const rows = await prisma.fAQItem.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });
  const faqs: FAQData[] = rows.map((f) => ({
    id: f.id, questionTr: f.questionTr, questionEn: f.questionEn,
    answerTr: f.answerTr, answerEn: f.answerEn,
    order: f.order, isActive: f.isActive,
  }));
  return <FAQClient faqs={faqs} />;
}
