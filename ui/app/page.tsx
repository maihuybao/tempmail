"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import BannerSlot from "@/components/BannerSlot";
import { Mail, ChevronDown } from "lucide-react";
import { getActiveDomains, getSiteConfig } from "@/app/actions/admin";

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
    const trimmed = input.trim();
    let username: string;
    let selectedDomain: string;

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

  return (
    <div className="min-h-screen flex flex-col">
      <BannerSlot position="home_top" />
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <Mail className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-semibold tracking-tight">{siteName}</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <p className="text-fg-muted text-sm">
          Temporary email, no signup required
        </p>

        <div className="flex gap-2">
          <div className="flex flex-1 rounded-lg border border-border bg-bg focus-within:ring-2 focus-within:ring-accent/50 focus-within:border-accent transition-colors">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="username (leave empty for random)"
              className="flex-1 min-w-0 px-4 py-2.5 bg-transparent text-fg placeholder:text-fg-muted focus:outline-none text-sm"
            />
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 h-full px-3 border-l border-border text-fg-muted hover:text-fg text-sm transition-colors"
              >
                <span className="hidden sm:inline">@</span>{domain}
                <ChevronDown className="w-3.5 h-3.5" />
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
            className="px-5 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors text-sm"
          >
            Go
          </button>
        </div>

        <p className="text-fg-muted text-xs">
          Public inbox &middot; Auto-deletes in 7 days
        </p>
        </div>
      </div>
      <BannerSlot position="home_bottom" />
    </div>
  );
}
