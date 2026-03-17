import LoginForm from "@/components/admin/LoginForm";
import { getAdminFromSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const admin = await getAdminFromSession();
  if (admin) redirect("/admin");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🦷</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Admin Paneli</h1>
          <p className="text-gray-500 text-sm mt-1">Yönetici girişi</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
