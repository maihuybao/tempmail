"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import EmailRow from "@/components/EmailRow";
import EmailDetail from "@/components/EmailDetail";
import { Suspense, useCallback, useEffect, useState } from "react";
import { searchEmails } from "@/app/actions/actions";
import { useSearchParams, useRouter } from "next/navigation";
import { SemiParserEmail } from "@/hooks/parseEmail";
import { Copy, RefreshCw, Mail, Inbox } from "lucide-react";

export interface Email {
  date: string;
  sender: string;
  recipients: string;
  data: SemiParserEmail;
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!query) router.push("/");
  }, [query, router]);

  const fetchEmails = useCallback(async () => {
    if (!query) return;
    try {
      const result = await searchEmails(`${query}@flux.shubh.sh`);
      setEmails(result);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [query]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEmails();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${query}@flux.shubh.sh`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fullEmail = `${query}@flux.shubh.sh`;
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
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Mail className="w-5 h-5 text-accent" />
          <span className="font-semibold text-sm hidden sm:inline">Flux Mail</span>
        </Link>

        <div className="flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-md bg-bg-subtle text-sm">
          <span className="text-fg-muted truncate max-w-[200px] sm:max-w-none">{fullEmail}</span>
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-bg-hover transition-colors"
            title="Copy email"
          >
            <Copy className="w-3.5 h-3.5 text-fg-muted" />
          </button>
          {copied && <span className="text-xs text-accent">Copied</span>}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-bg-hover transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-fg-muted ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Email list — hidden on mobile when an email is selected */}
        <div
          className={`w-full md:w-80 md:min-w-[320px] border-r border-border overflow-y-auto flex-shrink-0 ${
            selectedEmail ? "hidden md:block" : "block"
          }`}
        >
          {emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-fg-muted p-8 text-center">
              <Inbox className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">No emails yet</p>
              <p className="text-xs mt-1">
                Send an email to <span className="text-fg font-medium">{fullEmail}</span>
              </p>
            </div>
          ) : (
            emails.map((email, idx) => (
              <EmailRow
                key={idx}
                email={email}
                selected={selectedIdx === idx}
                onClick={() => setSelectedIdx(idx)}
              />
            ))
          )}
        </div>

        {/* Email detail */}
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
