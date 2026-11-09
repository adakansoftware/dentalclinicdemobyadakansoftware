export type PublicAppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export function getPublicStatusMeta(status: PublicAppointmentStatus, lang: "tr" | "en") {
  if (lang === "tr") {
    switch (status) {
      case "CANCELLED":
        return { label: "İptal Edildi", className: "bg-red-50 text-red-700 border border-red-200" };
      case "COMPLETED":
        return { label: "Tamamlandı", className: "bg-slate-100 text-slate-700 border border-slate-200" };
      default:
        return { label: "Aktif", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
    }
  }

  switch (status) {
    case "CANCELLED":
      return { label: "Cancelled", className: "bg-red-50 text-red-700 border border-red-200" };
    case "COMPLETED":
      return { label: "Completed", className: "bg-slate-100 text-slate-700 border border-slate-200" };
    default:
      return { label: "Active", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" };
  }
}
