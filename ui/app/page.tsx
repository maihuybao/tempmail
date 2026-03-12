"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { Mail } from "lucide-react";

export default function Home() {
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const username = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
    router.push(`/search?q=${encodeURIComponent(username.toLowerCase())}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <Mail className="w-8 h-8 text-accent" />
          <h1 className="text-3xl font-semibold tracking-tight">Flux Mail</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <p className="text-fg-muted text-sm">
          Temporary email, no signup required
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="username or user@domain..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-bg text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors text-sm"
          />
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
  );
}
