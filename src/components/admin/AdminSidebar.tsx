"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { startTransition } from "react";

interface Props {
  adminName: string;
}

const navItems = [
  { href: "/admin", label: "Genel Bakış", badge: "GB", exact: true },
  { href: "/admin/appointments", label: "Randevular", badge: "RN" },
  { href: "/admin/services", label: "Hizmetler", badge: "HZ" },
  { href: "/admin/specialists", label: "Uzmanlar", badge: "UZ" },
  { href: "/admin/working-hours", label: "Çalışma Saatleri", badge: "CS" },
  { href: "/admin/blocked-slots", label: "Bloke Slotlar", badge: "BS" },
  { href: "/admin/faq", label: "SSS", badge: "SS" },
  { href: "/admin/reviews", label: "Yorumlar", badge: "YR" },
  { href: "/admin/contact-requests", label: "İletişim", badge: "IL" },
  { href: "/admin/settings", label: "Site Ayarları", badge: "AY" },
];

export default function AdminSidebar({ adminName }: Props) {
  const pathname = usePathname();
  const safePathname = pathname ?? "";

  return (
    <aside className="flex min-h-screen w-72 shrink-0 flex-col bg-[color:var(--admin-sidebar-bg)]">
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-sm font-bold tracking-[0.12em] text-white">
            DC
          </div>
          <div>
            <p className="text-sm font-bold tracking-[-0.02em] text-white">Admin Panel</p>
            <p className="text-xs text-[rgba(232,241,247,0.72)]">{adminName}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[rgba(232,241,247,0.6)]">
          Klinik operasyonlarını daha sakin ve düzenli bir panelden yönetin.
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const active = item.exact ? safePathname === item.href : safePathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} className={`admin-sidebar-link ${active ? "active" : ""}`}>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-[10px] font-bold tracking-[0.12em] text-[rgba(232,241,247,0.85)]">
                {item.badge}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 p-4">
        <Link href="/" target="_blank" className="admin-sidebar-link text-sm">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-[10px] font-bold tracking-[0.12em] text-[rgba(232,241,247,0.85)]">
            WS
          </span>
          <span>Siteyi Aç</span>
        </Link>
        <form
          action={() => {
            startTransition(() => {
              void logoutAction();
            });
          }}
        >
          <button type="submit" className="admin-sidebar-link w-full text-red-300 hover:bg-red-500/15">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/15 text-[10px] font-bold tracking-[0.12em] text-red-300">
              CK
            </span>
            <span>Çıkış Yap</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
