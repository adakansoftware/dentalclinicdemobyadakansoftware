import { prisma } from "@/lib/prisma";
import FAQClient from "@/components/public/FAQClient";

export const revalidate = 60;

export default async function FAQPage() {
  const faqs = await prisma.fAQItem.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return <FAQClient faqs={faqs} />;
}
