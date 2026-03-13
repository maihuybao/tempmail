"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listBanners,
  upsertBanner,
  deleteBanner,
  Banner,
} from "@/app/actions/admin";
import { Trash2, Pencil, Plus, X, Eye, EyeOff, ToggleLeft, ToggleRight } from "lucide-react";
import { inputClass } from "@/lib/ui";
import { toast } from "sonner";

const POSITIONS = [
  { value: "home_top", label: "Home - Top" },
  { value: "home_bottom", label: "Home - Bottom" },
  { value: "inbox_top", label: "Inbox - Top" },
  { value: "inbox_bottom", label: "Inbox - Bottom" },
  { value: "inbox_left", label: "Inbox - Left sidebar" },
  { value: "inbox_right", label: "Inbox - Right sidebar" },
  { value: "reading_top", label: "Reading - Top" },
  { value: "reading_bottom", label: "Reading - Bottom" },
];

interface FormState {
  id: number | null;
  position: string;
  content: string;
  enabled: boolean;
  sort_order: number;
}

const emptyForm: FormState = {
  id: null,
  position: "home_top",
  content: "",
  enabled: true,
  sort_order: 0,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const data = await listBanners();
    setBanners(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    await upsertBanner(form.id, form.position, form.content, form.enabled, form.sort_order);
    setSaving(false);
    toast.success(form.id ? "Banner updated" : "Banner created");
    setForm(null);
    fetch();
  };

  const handleDelete = async (id: number) => {
    toast("Delete this banner?", {
      action: {
        label: "Delete",
        onClick: async () => {
          await deleteBanner(id);
          toast.success("Banner deleted");
          fetch();
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
      duration: 5000,
    });
  };

  const handleEdit = (b: Banner) => {
    setForm({
      id: b.id,
      position: b.position,
      content: b.content,
      enabled: b.enabled,
      sort_order: b.sort_order,
    });
    setPreview(false);
  };

  const handleToggle = async (b: Banner) => {
    await upsertBanner(b.id, b.position, b.content, !b.enabled, b.sort_order);
    toast.success(b.enabled ? "Banner disabled" : "Banner enabled");
    fetch();
  };

  const posLabel = (v: string) => POSITIONS.find((p) => p.value === v)?.label ?? v;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Banners</h1>
        {!form && (
          <button
            onClick={() => setForm({ ...emptyForm })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Banner
          </button>
        )}
      </div>
      {/* Form */}
      {form && (
        <div className="border border-border rounded-lg p-4 space-y-4 bg-bg-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">
              {form.id ? "Edit Banner" : "New Banner"}
            </h2>
            <button onClick={() => setForm(null)} className="p-1 hover:bg-bg-hover rounded transition-colors">
              <X className="w-4 h-4 text-fg-muted" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-fg-muted mb-1">Position</label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className={inputClass}
              >
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-fg-muted mb-1">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="cb"
                />
                Enabled
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-fg-muted">HTML Content</label>
              <button
                type="button"
                onClick={() => setPreview(!preview)}
                className="text-xs text-fg-muted hover:text-fg flex items-center gap-1 transition-colors"
              >
                {preview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {preview ? "Edit" : "Preview"}
              </button>
            </div>
            {preview ? (
              <div
                className="border border-border rounded-lg p-4 min-h-[120px] bg-bg"
                dangerouslySetInnerHTML={{ __html: form.content }}
              />
            ) : (
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={6}
                placeholder="<div>Your ad HTML here...</div>"
                className={inputClass + " font-mono resize-y"}
              />
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !form.content.trim()}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : form.id ? "Update" : "Create"}
          </button>
        </div>
      )}
      {/* Table */}
      {loading ? (
        <div className="text-sm text-fg-muted py-12 text-center">Loading...</div>
      ) : banners.length === 0 ? (
        <div className="text-sm text-fg-muted py-12 text-center">No banners yet</div>
      ) : (
        <>
        <div className="hidden sm:block border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-subtle border-b border-border">
                <th className="text-left px-3 py-2.5 font-medium text-fg-muted">Position</th>
                <th className="text-left px-3 py-2.5 font-medium text-fg-muted">Preview</th>
                <th className="text-left px-3 py-2.5 font-medium text-fg-muted w-16">Order</th>
                <th className="text-right px-3 py-2.5 font-medium text-fg-muted w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id} className="border-b border-border hover:bg-bg-hover transition-colors">
                  <td className="px-3 py-2.5">{posLabel(b.position)}</td>
                  <td className="px-3 py-2.5 truncate max-w-[300px] text-fg-muted font-mono text-xs">
                    {b.content.slice(0, 80)}{b.content.length > 80 ? "..." : ""}
                  </td>
                  <td className="px-3 py-2.5 text-fg-muted">{b.sort_order}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleToggle(b)} className="p-1.5 rounded hover:bg-bg-hover transition-colors" title={b.enabled ? "Disable" : "Enable"}>
                        {b.enabled ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-fg-muted" />}
                      </button>
                      <button onClick={() => handleEdit(b)} className="p-1.5 rounded hover:bg-bg-hover transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5 text-fg-muted" />
                      </button>
                      <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-2">
          {banners.map((b) => (
            <div key={b.id} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{posLabel(b.position)}</p>
                  <p className="text-xs text-fg-muted">Order: {b.sort_order}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleToggle(b)} className="p-1.5 rounded hover:bg-bg-hover transition-colors" title={b.enabled ? "Disable" : "Enable"}>
                    {b.enabled ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-fg-muted" />}
                  </button>
                  <button onClick={() => handleEdit(b)} className="p-1.5 rounded hover:bg-bg-hover transition-colors" title="Edit">
                    <Pencil className="w-3.5 h-3.5 text-fg-muted" />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-fg-muted font-mono truncate">{b.content.slice(0, 60)}{b.content.length > 60 ? "..." : ""}</p>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
