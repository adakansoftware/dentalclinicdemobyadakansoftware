import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminContactClient from "@/components/admin/AdminContactClient";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  await requireAdmin();
  const requests = await prisma.contactRequest.findMany({ orderBy: { createdAt: "desc" } });
  return <AdminContactClient requests={requests} />;
}
