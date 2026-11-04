import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safe-query";

export default async function AdminDashboard() {
  await requireAdmin();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [todayCount, weekCount, pendingCount, recentAppointments, unreadContacts] = await Promise.all([
    safeQuery("admin today count", () => prisma.appointment.count({ where: { date: { gte: today, lte: todayEnd } } }), 0),
    safeQuery("admin week count", () => prisma.appointment.count({ where: { date: { gte: today, lte: weekEnd } } }), 0),
    safeQuery("admin pending count", () => prisma.appointment.count({ where: { status: "PENDING" } }), 0),
    safeQuery(
      "admin recent appointments",
      () =>
        prisma.appointment.findMany({
          where: { date: { gte: today } },
          orderBy: { date: "asc" },
          take: 5,
          include: { service: true, specialist: true },
        }),
      []
    ),
    safeQuery("admin unread contacts", () => prisma.contactRequest.count({ where: { isRead: false } }), 0),
  ]);

  const statusColors: Record<string, string> = {
    PENDING: "badge-pending",
    CONFIRMED: "badge-confirmed",
    CANCELLED: "badge-cancelled",
    COMPLETED: "badge-completed",
  };

  const statusLabels: Record<string, string> = {
    PENDING: "Bekliyor",
    CONFIRMED: "Onaylandı",
    CANCELLED: "İptal Edildi",
    COMPLETED: "Tamamlandı",
  };

  const completionRate = weekCount > 0 ? Math.max(0, Math.min(100, Math.round(((weekCount - pendingCount) / weekCount) * 100))) : 0;

  const stats = [
    { label: "Bugünkü Randevular", value: todayCount, accent: "text-cyan-700" },
    { label: "Bu Hafta", value: weekCount, accent: "text-sky-700" },
    { label: "Bekleyen", value: pendingCount, accent: "text-amber-600" },
    { label: "Okunmamış Mesaj", value: unreadContacts, accent: "text-violet-700" },
  ];

  const attentionItems = [
    { label: "Onay bekleyen randevu", value: pendingCount, tone: pendingCount > 0 ? "text-amber-600" : "text-emerald-600" },
    { label: "Okunmamış mesaj", value: unreadContacts, tone: unreadContacts > 0 ? "text-amber-600" : "text-emerald-600" },
    { label: "Haftalık tamamlanma ritmi", value: `${completionRate}%`, tone: "text-slate-900" },
  ];

  return (
    <div className="space-y-8">
      <div className="surface-panel relative overflow-hidden p-7 md:p-8">
        <div className="absolute inset-y-0 right-0 w-72 bg-[#5591b7]/10 blur-3xl" />
        <div className="relative z-10">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Operasyon Özeti</div>
          <h1 className="mb-2 text-3xl font-bold tracking-[-0.01em] text-gray-900">Dashboard</h1>
          <p className="max-w-2xl text-slate-600">
            Günlük yoğunluğu, bekleyen aksiyonları ve operasyon ritmini tek bakışta takip edebileceğiniz yönetim görünümü.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="surface-panel p-5">
            <div className={`text-3xl font-bold ${stat.accent}`}>{stat.value}</div>
            <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-panel p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Operasyon Kalitesi</div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.01em] text-slate-900">Günlük akışta ilk bakışta risk görünürlüğü</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Panel; bekleyen randevular, okunmamış mesajlar ve haftalık operasyon ritmini tek alanda görünür tutar.
          </p>
        </div>

        <div className="surface-panel p-6">
          <div className="space-y-4">
            {attentionItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className={`text-lg font-semibold ${item.tone}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-gray-900">Yaklaşan Randevular</h2>
          <a href="/admin/appointments" className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
            Tümünü Gör -&gt;
          </a>
        </div>
        {recentAppointments.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">Yaklaşan randevu yok</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{appointment.patientName}</p>
                  <p className="text-sm text-gray-500">
                    {appointment.service.nameTr} · {appointment.specialist.nameTr}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(appointment.date).toLocaleDateString("tr-TR")} {appointment.startTime}
                  </p>
                  <span className={statusColors[appointment.status] ?? "badge"}>{statusLabels[appointment.status] ?? appointment.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
