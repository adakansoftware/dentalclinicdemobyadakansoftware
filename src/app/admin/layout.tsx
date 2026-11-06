import type { Metadata } from "next";
import { getAdminFromSession } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminFromSession();

  if (!admin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <AdminSidebar adminName={admin.name} />
      <main className="flex-1 overflow-auto">
        <div className="p-5 pt-20 md:p-8">{children}</div>
      </main>
    </div>
  );
}
