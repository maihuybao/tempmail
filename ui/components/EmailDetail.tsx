"use client";

import { useState } from "react";
import { Email } from "@/app/search/SearchResults";
import { ArrowLeft, Trash2 } from "lucide-react";

interface EmailDetailProps {
  email: Email;
  onBack: () => void;
  onDelete?: () => void;
}

export default function EmailDetail({ email, onBack, onDelete }: EmailDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const date = new Date(email.date);
  const htmlContent = email.data.html || email.data.text_as_html || "";

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    setConfirmDelete(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        {onDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>

      {confirmDelete && (
        <div className="px-4 py-3 border-b border-border bg-red-500/5 flex items-center justify-between gap-3">
          <p className="text-sm text-red-500">Delete this email?</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setConfirmDelete(false)} className="px-3 py-1 rounded-lg text-sm text-fg-muted hover:bg-bg-hover transition-colors">Cancel</button>
            <button onClick={handleConfirmDelete} disabled={deleting} className="px-3 py-1 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50">
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <h1 className="text-xl font-semibold mb-4">{email.data.subject || "(No Subject)"}</h1>
        <div className="space-y-1 text-sm mb-6">
          <div className="flex gap-2"><span className="text-fg-muted w-12">From</span><span>{email.data.from}</span></div>
          <div className="flex gap-2"><span className="text-fg-muted w-12">To</span><span>{email.recipients}</span></div>
          <div className="flex gap-2">
            <span className="text-fg-muted w-12">Date</span>
            <span>{date.toLocaleDateString([], { weekday: "short", year: "numeric", month: "short", day: "numeric" })} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
        <div className="border-t border-border pt-4 overflow-x-auto">
          {htmlContent ? (
            <div className="email-body text-sm" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          ) : (
            <pre className="text-sm whitespace-pre-wrap">{email.data.text}</pre>
          )}
        </div>
      </div>
    </div>
  );
}