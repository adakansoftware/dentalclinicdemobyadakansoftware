import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminFAQClient from "@/components/admin/AdminFAQClient";

export const dynamic = "force-dynamic";

export default async function AdminFAQPage() {
  await requireAdmin();
  const faqs = await prisma.fAQItem.findMany({ orderBy: { order: "asc" } });
  return <AdminFAQClient faqs={faqs} />;
}
