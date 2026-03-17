import { getSiteSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import ContactClient from "@/components/public/ContactClient";

export const revalidate = 60;

export default async function ContactPage() {
  const [settings, workingHours] = await Promise.all([
    getSiteSettings(),
    prisma.workingHour.findMany({
      where: { specialist: { isActive: true } },
      orderBy: { dayOfWeek: "asc" },
      distinct: ["dayOfWeek"],
    }),
  ]);
  return <ContactClient settings={settings} workingHours={workingHours} />;
}
