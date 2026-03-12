"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Mail, ArrowLeft, Copy, Check } from "lucide-react";
import { getSiteConfig } from "@/app/actions/admin";

const endpoints = [
  {
    method: "GET",
    path: "/api/inbox",
    desc: "Lấy danh sách email của một địa chỉ.",
    params: [{ name: "email", type: "string", required: true, desc: "Địa chỉ email (vd: user@domain.com)" }],
    example: 'curl "https://your-domain.com/api/inbox?email=test@domain.com"',
    response: `{
  "ok": true,
  "count": 2,
  "emails": [
    {
      "date": "Mon, 10 Mar 2026 08:30:00 +0000",
      "sender": "<sender@example.com>",
      "recipients": "<user@domain.com>",
      "subject": "Hello",
      "from": "Sender Name <sender@example.com>",
      "text": "Plain text content",
      "html": "<p>HTML content</p>"
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/domains",
    desc: "Lấy danh sách domain đang hoạt động.",
    params: [],
    example: 'curl "https://your-domain.com/api/domains"',
    response: `{
  "ok": true,
  "domains": ["foxycrown.net", "locketgold.me"]
}`,
  },
  {
    method: "GET",
    path: "/api/generate",
    desc: "Tạo một địa chỉ email ngẫu nhiên.",
    params: [],
    example: 'curl "https://your-domain.com/api/generate"',
    response: `{
  "ok": true,
  "email": "k7x2m9qf@foxycrown.net",
  "username": "k7x2m9qf",
  "domain": "foxycrown.net"
}`,
  },
];

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-bg-hover transition-colors" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5 text-fg-muted" />}
    </button>
  );
}

export default function DocsPage() {
  const [siteName, setSiteName] = useState("");
  useEffect(() => { getSiteConfig().then((c) => setSiteName(c.site_name)); }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Mail className="w-6 h-6 text-accent" />
            <span className="font-semibold text-lg">{siteName}</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/contact" className="text-sm text-fg-muted hover:text-fg transition-colors">Contact</Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="flex-1 px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <div>
            <Link href="/" className="text-sm text-fg-muted hover:text-fg transition-colors inline-flex items-center gap-1 mb-4">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">API Documentation</h1>
            <p className="text-fg-muted text-sm mt-2">
              All endpoints return JSON. No authentication required.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-bg-subtle p-4 text-sm space-y-1">
            <p className="font-medium">Base URL</p>
            <p className="text-fg-muted font-mono text-xs">https://your-domain.com</p>
            <p className="text-fg-muted text-xs mt-1">All responses follow the format: <code className="bg-bg-hover px-1 py-0.5 rounded text-xs">{"{ ok: boolean, ... }"}</code></p>
          </div>

          {endpoints.map((ep) => (
            <div key={ep.path} className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 sm:px-5 py-4 bg-bg-subtle border-b border-border">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-accent-subtle text-accent">{ep.method}</span>
                  <code className="text-sm font-mono font-medium">{ep.path}</code>
                </div>
                <p className="text-sm text-fg-muted mt-1">{ep.desc}</p>
              </div>

              <div className="px-4 sm:px-5 py-4 space-y-4">
                {ep.params.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Parameters</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-fg-muted">
                            <th className="pb-1.5 pr-4 font-medium">Name</th>
                            <th className="pb-1.5 pr-4 font-medium">Type</th>
                            <th className="pb-1.5 pr-4 font-medium">Required</th>
                            <th className="pb-1.5 font-medium">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ep.params.map((p) => (
                            <tr key={p.name}>
                              <td className="py-1 pr-4 font-mono text-xs">{p.name}</td>
                              <td className="py-1 pr-4 text-fg-muted">{p.type}</td>
                              <td className="py-1 pr-4">{p.required ? <span className="text-accent text-xs">Yes</span> : "No"}</td>
                              <td className="py-1 text-fg-muted">{p.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-fg-muted uppercase tracking-wide">Example</p>
                    <CopyBtn text={ep.example} />
                  </div>
                  <pre className="bg-bg-subtle rounded-lg p-3 text-xs font-mono overflow-x-auto border border-border">{ep.example}</pre>
                </div>

                <div>
                  <p className="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Response</p>
                  <pre className="bg-bg-subtle rounded-lg p-3 text-xs font-mono overflow-x-auto border border-border">{ep.response}</pre>
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-border p-4 sm:p-5 space-y-2">
            <p className="text-sm font-medium">Error responses</p>
            <p className="text-sm text-fg-muted">All endpoints return <code className="bg-bg-hover px-1 py-0.5 rounded text-xs">500</code> on server errors:</p>
            <pre className="bg-bg-subtle rounded-lg p-3 text-xs font-mono overflow-x-auto border border-border">{`{ "ok": false, "error": "Internal server error" }`}</pre>
          </div>
        </div>
      </div>

      <footer className="border-t border-border px-4 sm:px-8 py-4 flex items-center justify-between text-xs text-fg-muted">
        <span>{siteName}</span>
        <Link href="/contact" className="hover:text-fg transition-colors">Contact</Link>
      </footer>
    </div>
  );
}
