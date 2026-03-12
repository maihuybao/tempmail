"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import BannerSlot from "@/components/BannerSlot";
import { Mail, ChevronDown, Shield, Clock, Zap, Globe, ArrowRight } from "lucide-react";
import { getActiveDomains, getSiteConfig } from "@/app/actions/admin";
import Link from "next/link";

export default function Home() {
  const [input, setInput] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [domain, setDomain] = useState("");
  const [open, setOpen] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [randomLen, setRandomLen] = useState(8);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    getActiveDomains().then((d) => {
      setDomains(d);
      setDomain(d[0]);
    });
    getSiteConfig().then((c) => {
      setSiteName(c.site_name);
      setRandomLen(c.random_email_length);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = () => {
    let username: string;
    let selectedDomain: string;
    const trimmed = input.trim();
    if (!trimmed) {
      username = Math.random().toString(36).slice(2, 2 + randomLen);
      selectedDomain = domains[Math.floor(Math.random() * domains.length)] || domain;
    } else if (trimmed.includes("@")) {
      username = trimmed.split("@")[0];
      selectedDomain = trimmed.split("@")[1] || domain;
    } else {
      username = trimmed;
      selectedDomain = domain;
    }
    router.push(
      `/search?q=${encodeURIComponent(username.toLowerCase())}&d=${encodeURIComponent(selectedDomain.toLowerCase())}`
    );
  };

  const features = [
    { icon: Zap, title: "Instant", desc: "No signup. Get a mailbox in one click." },
    { icon: Shield, title: "Private", desc: "No personal data collected or stored." },
    { icon: Clock, title: "Auto-delete", desc: "All emails are wiped after 7 days." },
    { icon: Globe, title: "Multi-domain", desc: "Choose from multiple email domains." },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <BannerSlot position="home_top" />

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4">
        <div className="flex items-center gap-2">
          <Mail className="w-6 h-6 text-accent" />
          <span className="font-semibold text-lg">{siteName}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/docs" className="text-sm text-fg-muted hover:text-fg transition-colors">API</Link>
          <Link href="/contact" className="text-sm text-fg-muted hover:text-fg transition-colors">Contact</Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-accent text-xs font-medium">
            <Shield className="w-3 h-3" /> No signup required
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Disposable email,<br />
            <span className="text-accent">instantly.</span>
          </h1>

          <p className="text-fg-muted text-sm sm:text-base max-w-md mx-auto">
            Protect your privacy with a temporary inbox. Receive emails without sharing your real address.
          </p>

          {/* Email input */}
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-2xl mx-auto">
            <div className="flex flex-1 rounded-xl border border-border bg-bg focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-accent transition-colors">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Enter username or leave empty"
                className="flex-1 min-w-0 px-4 py-3 bg-transparent text-fg placeholder:text-fg-muted focus:outline-none text-sm"
              />
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-1 h-full px-3 border-l border-border text-fg-muted hover:text-fg text-sm transition-colors"
                >
                  @{domain}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="absolute right-0 top-full mt-1 min-w-full w-max bg-bg border border-border rounded-lg shadow-lg z-10 py-1">
                    {domains.map((d) => (
                      <button
                        key={d}
                        onClick={() => { setDomain(d); setOpen(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-bg-hover transition-colors ${
                          d === domain ? "text-accent font-medium" : "text-fg"
                        }`}
                      >
                        @{d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-medium hover:bg-accent-hover transition-colors text-sm"
            >
              Open Inbox <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-fg-muted text-xs">
            Public inbox &middot; Auto-deletes in 7 days
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-8 pb-16">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-bg-subtle p-4 space-y-2 text-center">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-accent-subtle">
                <f.icon className="w-4 h-4 text-accent" />
              </div>
              <p className="text-sm font-medium">{f.title}</p>
              <p className="text-xs text-fg-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <BannerSlot position="home_bottom" />

      {/* Footer */}
      <footer className="border-t border-border px-4 sm:px-8 py-4 flex items-center justify-between text-xs text-fg-muted">
        <span>{siteName}</span>
        <div className="flex items-center gap-3">
          <Link href="/docs" className="hover:text-fg transition-colors">API</Link>
          <Link href="/contact" className="hover:text-fg transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
