import LoginForm from "@/components/admin/LoginForm";
import { getAdminFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const admin = await getAdminFromSession();
  if (admin) redirect("/admin");

  return (
    <div className="admin-shell min-h-screen px-4">
      <div className="section-shell flex min-h-screen items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[22px] border border-[rgba(207,216,211,0.84)] bg-[rgba(249,251,250,0.92)] text-sm font-semibold tracking-[0.18em] text-[color:var(--accent-main)] shadow-[var(--shadow-card)]">
              DC
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-[-0.01em] text-gray-900">Admin Paneli</h1>
            <p className="mt-2 text-sm text-gray-500">Yonetici girisi</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
