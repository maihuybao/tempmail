"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Mail, ArrowLeft, Globe, MessageCircle, Send } from "lucide-react";
import { getSiteConfig } from "@/app/actions/admin";

export default function ContactPage() {
  const [siteName, setSiteName] = useState("");
  useEffect(() => { getSiteConfig().then((c) => setSiteName(c.site_name)); }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Mail className="w-6 h-6 text-accent" />
          <span className="font-semibold text-lg">{siteName}</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/docs" className="text-sm text-fg-muted hover:text-fg transition-colors">API Docs</Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="flex-1 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-xl mx-auto space-y-8">
          <div>
            <Link href="/" className="text-sm text-fg-muted hover:text-fg transition-colors inline-flex items-center gap-1 mb-4">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">Contact</h1>
            <p className="text-fg-muted text-sm mt-2">Get in touch with the admin team.</p>
          </div>

          <div className="rounded-xl border border-accent/30 bg-accent-subtle p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-accent" />
              <p className="text-sm font-medium">Want to add your domain?</p>
            </div>
            <p className="text-sm text-fg-muted">
              If you own a domain and want it added to {siteName}, contact the admin below.
              We will configure the MX records and set everything up for you.
            </p>
          </div>

          <div className="rounded-xl border border-border p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-accent" />
              <p className="text-sm font-medium">Contact Information</p>
            </div>
            <div className="space-y-3 text-sm">
              <a href="https://t.me/Mo_Ho_Bo" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-lg bg-bg-subtle hover:bg-bg-hover transition-colors">
                <Send className="w-4 h-4 text-fg-muted mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-fg-muted mb-0.5">Telegram</p>
                  <p className="text-fg">@Mo_Ho_Bo</p>
                </div>
              </a>
            </div>
            <p className="text-xs text-fg-muted">
              Please include your domain name and any relevant details in your message.
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t border-border px-4 sm:px-8 py-4 flex items-center justify-between text-xs text-fg-muted">
        <span>{siteName}</span>
        <Link href="/docs" className="hover:text-fg transition-colors">API Docs</Link>
      </footer>
    </div>
  );
}