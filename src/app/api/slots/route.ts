import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const specialistId = searchParams.get("specialistId");
  const date = searchParams.get("date");

  if (!specialistId || !date) {
    return NextResponse.json({ error: "specialistId and date required" }, { status: 400 });
  }

  const slots = await getAvailableSlots(specialistId, date);
  return NextResponse.json(slots);
}
