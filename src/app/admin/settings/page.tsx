import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";
import AdminSettingsClient from "@/components/admin/AdminSettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSiteSettings();
  return <AdminSettingsClient settings={settings} />;
}
