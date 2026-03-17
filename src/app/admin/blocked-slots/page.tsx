import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminBlockedSlotsClient from "@/components/admin/AdminBlockedSlotsClient";

export const dynamic = "force-dynamic";

export default async function AdminBlockedSlotsPage() {
  await requireAdmin();
  const [specialists, blockedSlots] = await Promise.all([
    prisma.specialist.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    prisma.blockedSlot.findMany({
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
      include: { specialist: { select: { nameTr: true } } },
    }),
  ]);
  return (
    <AdminBlockedSlotsClient
      specialists={specialists}
      blockedSlots={blockedSlots.map((bs) => ({
        ...bs,
        date: bs.date.toISOString(),
        createdAt: bs.createdAt.toISOString(),
      }))}
    />
  );
}
