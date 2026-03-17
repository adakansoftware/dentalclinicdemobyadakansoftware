import { getAdminFromSession } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

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
    <>
      <style>{`
        :root {
          --color-primary: #1a6b8a;
          --color-accent: #f0a500;
          --color-primary-dark: #145470;
          --color-primary-light: #e8f4f8;
        }
      `}</style>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar adminName={admin.name} />
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
    </>
  );
}
