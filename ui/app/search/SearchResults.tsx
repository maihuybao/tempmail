"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import EmailRow from "@/components/EmailRow";
import EmailDetail from "@/components/EmailDetail";
import { Suspense, useCallback, useEffect, useState } from "react";
import { searchEmails } from "@/app/actions/actions";
import { getActiveDomains } from "@/app/actions/admin";
import { useSearchParams, useRouter } from "next/navigation";
import { SemiParserEmail } from "@/hooks/parseEmail";
import {
  Copy,
  Check,
  RefreshCw,
  Mail,
  Inbox,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import BannerSlot from "@/components/BannerSlot";

export interface Email {
  date: string;
  sender: string;
  recipients: string;
  data: SemiParserEmail;
}

const PAGE_SIZE = 20;

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [domains, setDomains] = useState<string[]>([]);
  const paramDomain = searchParams.get("d") || "";
  const domain = paramDomain || domains[0] || "foxycrown.net";

  useEffect(() => {
    getActiveDomains().then(setDomains);
  }, []);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!query) router.push("/");
  }, [query, router]);

  const fetchEmails = useCallback(async () => {
    if (!query) return;
    try {
      const result = await searchEmails(`${query}@${domain}`);
      setEmails(result);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query, domain]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEmails();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${query}@${domain}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fullEmail = `${query}@${domain}`;
  const totalPages = Math.max(1, Math.ceil(emails.length / PAGE_SIZE));
  const pagedEmails = emails.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedEmail = selectedIdx !== null ? emails[selectedIdx] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-fg-muted text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <BannerSlot position="inbox_top" />

      {/* Top bar — email address + copy */}
      <header className="flex items-center gap-2 px-4 py-3 border-b border-border flex-shrink-0">
        <Link href="/" className="hover:opacity-80 transition-opacity mr-1">
          <Mail className="w-5 h-5 text-accent" />
        </Link>
        <span className="text-sm font-medium truncate">{fullEmail}</span>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-bg-hover transition-colors"
          title="Copy email"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-accent" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-fg-muted" />
          )}
        </button>
        {copied && <span className="text-xs text-accent">Copied!</span>}
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — toolbar + email list */}
        <div
          className={`w-full md:w-80 md:min-w-[320px] border-r border-border flex flex-col flex-shrink-0 ${
            selectedEmail ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0 text-fg-muted">
            <button className="p-1.5 rounded hover:bg-bg-hover transition-colors" title="More">
              <MoreVertical className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 rounded hover:bg-bg-hover transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs px-1">page {page}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1 rounded hover:bg-bg-hover transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs ml-2">{emails.length} mails</span>
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded hover:bg-bg-hover transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Email list */}
          <div className="flex-1 overflow-y-auto">
            {emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-fg-muted p-8 text-center">
                <Inbox className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">No emails yet.</p>
                <p className="text-xs mt-1">
                  Send to <span className="text-fg font-medium">{fullEmail}</span>
                </p>
              </div>
            ) : (
              pagedEmails.map((email, idx) => {
                const realIdx = (page - 1) * PAGE_SIZE + idx;
                return (
                  <EmailRow
                    key={realIdx}
                    email={email}
                    selected={selectedIdx === realIdx}
                    onClick={() => setSelectedIdx(realIdx)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Right panel — email detail */}
        <div
          className={`flex-1 overflow-hidden ${
            selectedEmail ? "block" : "hidden md:block"
          }`}
        >
          {selectedEmail ? (
            <EmailDetail
              email={selectedEmail}
              onBack={() => setSelectedIdx(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-fg-muted">
              <Mail className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">Select an email to read</p>
            </div>
          )}
        </div>
      </div>
      <BannerSlot position="inbox_bottom" />
    </div>
  );
}

export default function SearchResults() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen text-fg-muted text-sm">
          Loading...
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
