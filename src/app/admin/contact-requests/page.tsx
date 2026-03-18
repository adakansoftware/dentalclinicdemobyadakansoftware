import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminContactClient from "@/components/admin/AdminContactClient";
import type { ContactRequestData } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  await requireAdmin();
  const rows = await prisma.contactRequest.findMany({ orderBy: { createdAt: "desc" } });
  const requests: ContactRequestData[] = rows.map((r) => ({
    id: r.id, name: r.name, phone: r.phone, email: r.email,
    subject: r.subject, message: r.message, isRead: r.isRead,
    createdAt: r.createdAt.toISOString(),
  }));
  return <AdminContactClient requests={requests} />;
}
