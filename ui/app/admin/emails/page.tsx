"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  listEmails,
  deleteEmail,
  deleteEmails,
  updateEmail,
} from "@/app/actions/admin";
import {
  Trash2, ChevronLeft, ChevronRight, Inbox, ArrowLeft,
  Search, ArrowUpDown, Pencil, X,
} from "lucide-react";
import { inputClass } from "@/lib/ui";
import { toast } from "sonner";

interface AdminEmail {
  id: number;
  date: string;
  sender: string;
  recipients: string;
  data: { subject: string; from: string; text: string; html: string; text_as_html: string; date: string };
}

interface EditForm { id: number; sender: string; recipient: string; subject: string; body: string }

export default function AdminEmailsPage() {
  const [emails, setEmails] = useState<AdminEmail[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [viewEmail, setViewEmail] = useState<AdminEmail | null>(null);
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("DESC");
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const pageSize = 30;

  const fetchPage = useCallback(
    async (p: number, q: string = search, dir: "ASC" | "DESC" = sortDir) => {
      setLoading(true);
      try {
        const result = await listEmails(p, pageSize, q, dir);
        setEmails(result.emails);
        setTotal(result.total);
        setPage(p);
        setSelected(new Set());
      } finally { setLoading(false); }
    }, [search, sortDir]
  );

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchPage(1, value, sortDir), 400);
  };
  const handleSort = () => { const next = sortDir === "DESC" ? "ASC" : "DESC"; setSortDir(next); fetchPage(1, search, next); };
  const toggleSelect = (id: number) => { setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; }); };
  const toggleAll = () => { if (selected.size === emails.length) setSelected(new Set()); else setSelected(new Set(emails.map((e) => e.id))); };

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    toast(`Delete ${selected.size} email(s)?`, {
      action: { label: "Delete", onClick: async () => { await deleteEmails(Array.from(selected)); toast.success(`${selected.size} email(s) deleted`); fetchPage(page, search, sortDir); } },
      cancel: { label: "Cancel", onClick: () => {} }, duration: 5000,
    });
  };
  const handleDeleteOne = (email: AdminEmail) => {
    toast(`Delete "${email.data.subject || "(No Subject)"}"?`, {
      action: { label: "Delete", onClick: async () => { await deleteEmail(email.id); toast.success("Email deleted"); fetchPage(page, search, sortDir); } },
      cancel: { label: "Cancel", onClick: () => {} }, duration: 5000,
    });
  };
  const openEdit = (email: AdminEmail) => {
    setEditForm({ id: email.id, sender: (email.data.from || email.sender).replace(/^<|>$/g, ""), recipient: email.recipients.replace(/^<|>$/g, ""), subject: email.data.subject || "", body: email.data.text || "" });
  };
  const handleSaveEdit = async () => {
    if (!editForm) return;
    setSaving(true);
    const res = await updateEmail(editForm.id, editForm.sender, editForm.recipient, editForm.subject, editForm.body);
    setSaving(false);
    if (res.ok) { toast.success("Email updated"); setEditForm(null); fetchPage(page, search, sortDir); }
    else { toast.error("error" in res ? (res as { error: string }).error : "Failed to update"); }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const fmtDate = (d: string) => new Date(d).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  // Edit modal
  const editModal = editForm && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-bg border border-border rounded-xl shadow-xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Edit Email</h2>
          <button onClick={() => setEditForm(null)} className="p-1 hover:bg-bg-hover rounded transition-colors"><X className="w-4 h-4 text-fg-muted" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="block text-xs text-fg-muted mb-1">From</label><input className={inputClass} value={editForm.sender} onChange={(e) => setEditForm({ ...editForm, sender: e.target.value })} /></div>
          <div><label className="block text-xs text-fg-muted mb-1">To</label><input className={inputClass} value={editForm.recipient} onChange={(e) => setEditForm({ ...editForm, recipient: e.target.value })} /></div>
          <div><label className="block text-xs text-fg-muted mb-1">Subject</label><input className={inputClass} value={editForm.subject} onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })} /></div>
          <div><label className="block text-xs text-fg-muted mb-1">Body</label><textarea className={inputClass + " resize-y"} rows={6} value={editForm.body} onChange={(e) => setEditForm({ ...editForm, body: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditForm(null)} className="px-3 py-1.5 rounded-lg text-sm text-fg-muted hover:bg-bg-hover transition-colors">Cancel</button>
          <button onClick={handleSaveEdit} disabled={saving} className="px-4 py-1.5 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </div>
  );
  // Detail view
  if (viewEmail) {
    const htmlContent = viewEmail.data.html || viewEmail.data.text_as_html || "";
    const date = new Date(viewEmail.date);
    return (
      <div className="h-full flex flex-col">
        {editModal}
        <div className="px-4 sm:px-6 py-3 border-b border-border flex items-center justify-between">
          <button onClick={() => setViewEmail(null)} className="text-sm text-fg-muted hover:text-fg transition-colors flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => openEdit(viewEmail)} className="p-1.5 rounded hover:bg-bg-hover transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5 text-fg-muted" /></button>
            <button onClick={() => handleDeleteOne(viewEmail)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <h1 className="text-lg sm:text-xl font-semibold mb-4">{viewEmail.data.subject || "(No Subject)"}</h1>
          <div className="space-y-1 text-sm mb-6">
            <div className="flex gap-2"><span className="text-fg-muted w-12 flex-shrink-0">From</span><span className="break-all">{viewEmail.data.from || viewEmail.sender}</span></div>
            <div className="flex gap-2"><span className="text-fg-muted w-12 flex-shrink-0">To</span><span className="break-all">{viewEmail.recipients}</span></div>
            <div className="flex gap-2"><span className="text-fg-muted w-12 flex-shrink-0">Date</span><span>{date.toLocaleDateString([], { weekday: "short", year: "numeric", month: "short", day: "numeric" })} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
          </div>
          <div className="border-t border-border pt-4 overflow-x-auto">
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

  // Pagination
  const pagination = totalPages > 1 && (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button onClick={() => fetchPage(page - 1, search, sortDir)} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-bg-hover disabled:opacity-30 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
      <span className="text-sm text-fg-muted">{page} / {totalPages}</span>
      <button onClick={() => fetchPage(page + 1, search, sortDir)} disabled={page >= totalPages} className="p-1.5 rounded-lg hover:bg-bg-hover disabled:opacity-30 transition-colors"><ChevronRight className="w-4 h-4" /></button>
    </div>
  );

  // List view
  return (
    <div className="p-4 sm:p-6 space-y-4">
      {editModal}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Emails</h1>
        <span className="text-sm text-fg-muted">{total} total</span>
      </div>

      {/* Search + sort */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-muted" />
          <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Search..." className={inputClass + " pl-9"} />
        </div>
        <button onClick={handleSort} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-fg-muted hover:bg-bg-hover transition-colors flex-shrink-0" title={`Sort by ${sortDir === "DESC" ? "oldest" : "newest"}`}>
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{sortDir === "DESC" ? "Newest" : "Oldest"}</span>
        </button>
      </div>

      {selected.size > 0 && (
        <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-sm hover:bg-red-500/20 transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> Delete {selected.size}
        </button>
      )}

      {loading ? (
        <div className="text-sm text-fg-muted py-12 text-center">Loading...</div>
      ) : emails.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-fg-muted">
          <Inbox className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">{search ? "No results" : "No emails"}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-subtle border-b border-border">
                  <th className="w-10 px-3 py-2.5"><input type="checkbox" checked={selected.size === emails.length && emails.length > 0} onChange={toggleAll} className="cb" /></th>
                  <th className="text-left px-3 py-2.5 font-medium text-fg-muted">From</th>
                  <th className="text-left px-3 py-2.5 font-medium text-fg-muted">To</th>
                  <th className="text-left px-3 py-2.5 font-medium text-fg-muted">Subject</th>
                  <th className="text-left px-3 py-2.5 font-medium text-fg-muted">Date</th>
                  <th className="text-right px-3 py-2.5 font-medium text-fg-muted w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((email) => (
                  <tr key={email.id} className="border-b border-border hover:bg-bg-hover transition-colors cursor-pointer" onClick={() => setViewEmail(email)}>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.has(email.id)} onChange={() => toggleSelect(email.id)} className="cb" /></td>
                    <td className="px-3 py-2.5 truncate max-w-[180px]">{email.data.from || email.sender}</td>
                    <td className="px-3 py-2.5 truncate max-w-[180px]">{email.recipients}</td>
                    <td className="px-3 py-2.5 truncate max-w-[250px]">{email.data.subject || "(No Subject)"}</td>
                    <td className="px-3 py-2.5 text-fg-muted whitespace-nowrap">{fmtDate(email.date)}</td>
                    <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(email)} className="p-1.5 rounded hover:bg-bg-hover transition-colors" title="Edit"><Pencil className="w-3.5 h-3.5 text-fg-muted" /></button>
                        <button onClick={() => handleDeleteOne(email)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {emails.map((email) => (
              <div key={email.id} onClick={() => setViewEmail(email)} className="border border-border rounded-lg p-3 hover:bg-bg-hover transition-colors cursor-pointer space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{email.data.subject || "(No Subject)"}</p>
                    <p className="text-xs text-fg-muted truncate">{email.data.from || email.sender}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(email.id)} onChange={() => toggleSelect(email.id)} className="cb" />
                    <button onClick={() => openEdit(email)} className="p-1 rounded hover:bg-bg-hover transition-colors"><Pencil className="w-3.5 h-3.5 text-fg-muted" /></button>
                    <button onClick={() => handleDeleteOne(email)} className="p-1 rounded hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-fg-muted">
                  <span className="truncate">{email.recipients}</span>
                  <span className="flex-shrink-0 ml-2">{fmtDate(email.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {pagination}
    </div>
  );
}
