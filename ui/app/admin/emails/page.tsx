"use client";

import { useCallback, useEffect, useState } from "react";
import { listEmails, deleteEmails } from "@/app/actions/admin";
import { Trash2, ChevronLeft, ChevronRight, Inbox, ArrowLeft } from "lucide-react";

interface AdminEmail {
  id: number;
  date: string;
  sender: string;
  recipients: string;
  data: {
    subject: string;
    from: string;
    text: string;
    html: string;
    text_as_html: string;
    date: string;
  };
}

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<AdminEmail[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [viewEmail, setViewEmail] = useState<AdminEmail | null>(null);
  const pageSize = 30;

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const result = await listEmails(p, pageSize);
      setEmails(result.emails);
      setTotal(result.total);
      setPage(p);
      setSelected(new Set());
      setViewEmail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === emails.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(emails.map((e) => e.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    await deleteEmails(Array.from(selected));
    fetchPage(page);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (viewEmail) {
    const htmlContent = viewEmail.data.html || viewEmail.data.text_as_html || "";
    const date = new Date(viewEmail.date);
    return (
      <div className="h-full flex flex-col">
        <div className="px-6 py-3 border-b border-border">
          <button
            onClick={() => setViewEmail(null)}
            className="text-sm text-fg-muted hover:text-fg transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back to list
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <h1 className="text-xl font-semibold mb-4">
            {viewEmail.data.subject || "(No Subject)"}
          </h1>
          <div className="space-y-1 text-sm mb-6">
            <div className="flex gap-2">
              <span className="text-fg-muted w-12">From</span>
              <span>{viewEmail.data.from || viewEmail.sender}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-fg-muted w-12">To</span>
              <span>{viewEmail.recipients}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-fg-muted w-12">Date</span>
              <span>
                {date.toLocaleDateString([], { weekday: "short", year: "numeric", month: "short", day: "numeric" })}{" "}
                {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            {htmlContent ? (
              <div className="email-body text-sm" dangerouslySetInnerHTML={{ __html: htmlContent }} />
            ) : (
              <pre className="text-sm whitespace-pre-wrap">{viewEmail.data.text}</pre>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Emails</h1>
        <span className="text-sm text-fg-muted">{total} total</span>
      </div>

      {selected.size > 0 && (
        <button
          onClick={handleBulkDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-sm hover:bg-red-500/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete {selected.size} selected
        </button>
      )}

      {loading ? (
        <div className="text-sm text-fg-muted py-12 text-center">Loading...</div>
      ) : emails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-fg-muted">
          <Inbox className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No emails</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-subtle border-b border-border">
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.size === emails.length}
                    onChange={toggleAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left px-3 py-2.5 font-medium text-fg-muted">From</th>
                <th className="text-left px-3 py-2.5 font-medium text-fg-muted">To</th>
                <th className="text-left px-3 py-2.5 font-medium text-fg-muted">Subject</th>
                <th className="text-left px-3 py-2.5 font-medium text-fg-muted">Date</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((email) => (
                <tr
                  key={email.id}
                  className="border-b border-border hover:bg-bg-hover transition-colors cursor-pointer"
                  onClick={() => setViewEmail(email)}
                >
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(email.id)}
                      onChange={() => toggleSelect(email.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-2.5 truncate max-w-[180px]">
                    {email.data.from || email.sender}
                  </td>
                  <td className="px-3 py-2.5 truncate max-w-[180px]">{email.recipients}</td>
                  <td className="px-3 py-2.5 truncate max-w-[250px]">
                    {email.data.subject || "(No Subject)"}
                  </td>
                  <td className="px-3 py-2.5 text-fg-muted whitespace-nowrap">
                    {new Date(email.date).toLocaleDateString([], {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => fetchPage(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg hover:bg-bg-hover disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-fg-muted">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => fetchPage(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg hover:bg-bg-hover disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
