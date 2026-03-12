"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Inbox, PenSquare, LayoutTemplate, Globe, Settings, LogOut, Menu, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { adminLogout, getSiteConfig } from "@/app/actions/admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [siteName, setSiteName] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => { getSiteConfig().then((c) => setSiteName(c.site_name)); }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  if (pathname === "/admin/login") return <>{children}</>;

  const nav = [
    { href: "/admin/emails", label: "Emails", icon: Inbox },
    { href: "/admin/banners", label: "Banners", icon: LayoutTemplate },
    { href: "/admin/domains", label: "Domains", icon: Globe },
    { href: "/admin/compose", label: "Compose", icon: PenSquare },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  const sidebar = (
    <aside className="w-56 flex-shrink-0 border-r border-border flex flex-col bg-bg-subtle h-full">
      <div className="px-4 py-4 border-b border-border flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 min-w-0">
          <Mail className="w-5 h-5 text-accent flex-shrink-0" />
          <span className="font-semibold text-sm truncate">{siteName}</span>
          <span className="text-xs text-fg-muted bg-bg-hover px-1.5 py-0.5 rounded flex-shrink-0">Admin</span>
        </Link>
        <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-bg-hover md:hidden">
          <X className="w-4 h-4 text-fg-muted" />
        </button>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? "bg-accent-subtle text-accent font-medium" : "text-fg-muted hover:bg-bg-hover hover:text-fg"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 py-3 border-t border-border space-y-1">
        <ThemeToggle />
        <button onClick={() => adminLogout()}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-fg-muted hover:bg-bg-hover hover:text-fg transition-colors w-full"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">{sidebar}</div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative z-50">{sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border md:hidden">
          <button onClick={() => setOpen(true)} className="p-1 rounded hover:bg-bg-hover">
            <Menu className="w-5 h-5 text-fg-muted" />
          </button>
          <span className="font-semibold text-sm">{siteName}</span>
          <span className="text-xs text-fg-muted bg-bg-hover px-1.5 py-0.5 rounded">Admin</span>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
