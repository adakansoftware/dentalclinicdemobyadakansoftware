"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { startTransition } from "react";

interface Props { adminName: string; }

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊", exact: true },
  { href: "/admin/appointments", label: "Randevular", icon: "📅" },
  { href: "/admin/services", label: "Hizmetler", icon: "🦷" },
  { href: "/admin/specialists", label: "Uzmanlar", icon: "👨‍⚕️" },
  { href: "/admin/working-hours", label: "Çalışma Saatleri", icon: "🕐" },
  { href: "/admin/blocked-slots", label: "Bloke Slotlar", icon: "🚫" },
  { href: "/admin/faq", label: "SSS", icon: "❓" },
  { href: "/admin/reviews", label: "Yorumlar", icon: "⭐" },
  { href: "/admin/contact-requests", label: "İletişim", icon: "✉️" },
  { href: "/admin/settings", label: "Site Ayarları", icon: "⚙️" },
];

export default function AdminSidebar({ adminName }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦷</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">Admin Panel</p>
            <p className="text-xs text-gray-400">{adminName}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`admin-sidebar-link ${active ? "active" : ""}`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <Link href="/" target="_blank" className="admin-sidebar-link text-xs">
          <span>🌐</span><span>Siteyi Görüntüle</span>
        </Link>
        <form action={() => { startTransition(() => { void logoutAction(); }); }}>
          <button type="submit" className="admin-sidebar-link w-full text-red-600 hover:bg-red-50">
            <span>🚪</span><span>Çıkış Yap</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
