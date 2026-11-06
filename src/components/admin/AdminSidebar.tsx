"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { startTransition, useState } from "react";

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
  const [open, setOpen] = useState(false);
  const safePathname = pathname ?? "";

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[color:var(--admin-sidebar-bg)] px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 text-xs font-bold tracking-[0.12em] text-white">
            AD
          </div>
          <p className="text-sm font-bold tracking-[-0.02em] text-white">Admin Panel</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="admin-sidebar"
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      ) : null}

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col bg-[color:var(--admin-sidebar-bg)] transition-transform duration-300 md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-sm font-bold tracking-[0.12em] text-white">
              AD
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
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`admin-sidebar-link ${active ? "active" : ""}`}
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-[10px] font-bold tracking-[0.12em] text-[rgba(232,241,247,0.85)]">
                  {item.badge}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/10 p-4">
          <Link href="/" target="_blank" onClick={() => setOpen(false)} className="admin-sidebar-link text-sm">
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
    </>
  );
}
