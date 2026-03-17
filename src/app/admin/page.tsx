import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  await requireAdmin();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [todayCount, weekCount, pendingCount, recentAppointments, unreadContacts] = await Promise.all([
    prisma.appointment.count({ where: { date: { gte: today, lte: todayEnd } } }),
    prisma.appointment.count({ where: { date: { gte: today, lte: weekEnd } } }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.findMany({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
      take: 5,
      include: { service: true, specialist: true },
    }),
    prisma.contactRequest.count({ where: { isRead: false } }),
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
    CANCELLED: "İptal",
    COMPLETED: "Tamamlandı",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Bugünkü Randevular", value: todayCount, icon: "📅", color: "#1a6b8a" },
          { label: "Bu Hafta", value: weekCount, icon: "📆", color: "#0891b2" },
          { label: "Bekleyen", value: pendingCount, icon: "⏳", color: "#d97706" },
          { label: "Okunmamış Mesaj", value: unreadContacts, icon: "✉️", color: "#7c3aed" },
        ].map((stat) => (
          <div key={stat.label} className="card p-5 flex items-center gap-4">
            <div className="text-3xl">{stat.icon}</div>
            <div>
              <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent appointments */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Yaklaşan Randevular</h2>
          <a href="/admin/appointments" className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>Tümünü Gör →</a>
        </div>
        {recentAppointments.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 text-sm">Yaklaşan randevu yok</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentAppointments.map((apt) => (
              <div key={apt.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{apt.patientName}</p>
                  <p className="text-sm text-gray-500">
                    {apt.service.nameTr} · {apt.specialist.nameTr}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(apt.date).toLocaleDateString("tr-TR")} {apt.startTime}
                  </p>
                  <span className={statusColors[apt.status] ?? "badge"}>{statusLabels[apt.status] ?? apt.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
