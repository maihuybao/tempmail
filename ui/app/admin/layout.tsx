"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Inbox, PenSquare, LayoutTemplate, Globe, Settings, LogOut } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { adminLogout, getSiteConfig } from "@/app/actions/admin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [siteName, setSiteName] = useState("Flux Mail");

  useEffect(() => {
    getSiteConfig().then((c) => setSiteName(c.site_name));
  }, []);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const nav = [
    { href: "/admin/emails", label: "Emails", icon: Inbox },
    { href: "/admin/banners", label: "Banners", icon: LayoutTemplate },
    { href: "/admin/domains", label: "Domains", icon: Globe },
    { href: "/admin/compose", label: "Compose", icon: PenSquare },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 flex-shrink-0 border-r border-border flex flex-col bg-bg-subtle">
        <div className="px-4 py-4 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-accent" />
            <span className="font-semibold text-sm">{siteName}</span>
            <span className="text-xs text-fg-muted bg-bg-hover px-1.5 py-0.5 rounded">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-accent-subtle text-accent font-medium"
                    : "text-fg-muted hover:bg-bg-hover hover:text-fg"
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
          <button
            onClick={() => adminLogout()}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-fg-muted hover:bg-bg-hover hover:text-fg transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
