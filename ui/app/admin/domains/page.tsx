"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listDomains,
  addDomain,
  updateDomain,
  deleteDomain,
  Domain,
} from "@/app/actions/admin";
import { Trash2, Plus, X, Globe, ToggleLeft, ToggleRight } from "lucide-react";
import { inputClass } from "@/lib/ui";
import { toast } from "sonner";

export default function AdminDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formDomain, setFormDomain] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDomains = useCallback(async () => {
    setLoading(true);
    const data = await listDomains();
    setDomains(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleAdd = async () => {
    if (!formDomain.trim()) return;
    setSaving(true);
    try {
      const res = await addDomain(formDomain);
      if (!res.ok) {
        toast.error(res.error || "Failed to add domain");
      } else {
        if (res.dnsErrors?.length) {
          toast.warning(`Domain added. DNS warnings: ${res.dnsErrors.join("; ")}`);
        } else {
          toast.success(`${formDomain} added`);
        }
        setFormDomain("");
        setShowForm(false);
        fetchDomains();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add domain");
    }
    setSaving(false);
  };
  const handleToggle = async (d: Domain) => {
    await updateDomain(d.id, !d.enabled);
    toast.success(d.enabled ? `${d.domain} disabled` : `${d.domain} enabled`);
    fetchDomains();
  };

  const handleDelete = async (d: Domain) => {
    const doDelete = async (removeDNS: boolean) => {
      const res = await deleteDomain(d.id, removeDNS);
      if (res.dnsErrors?.length) {
        toast.warning(`Domain deleted. DNS warnings: ${res.dnsErrors.join("; ")}`);
      } else {
        toast.success(`${d.domain} deleted`);
      }
      fetchDomains();
    };

    if (d.cf_zone_id) {
      toast(`Delete ${d.domain}?`, {
        description: "This domain has DNS records on Cloudflare.",
        action: { label: "Delete + Remove DNS", onClick: () => doDelete(true) },
        cancel: { label: "Delete only", onClick: () => doDelete(false) },
        duration: 10000,
      });
    } else {
      toast(`Delete ${d.domain}?`, {
        action: { label: "Delete", onClick: () => doDelete(false) },
        cancel: { label: "Cancel", onClick: () => {} },
        duration: 5000,
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Domains</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Domain
          </button>
        )}
      </div>

      {showForm && (
        <div className="border border-border rounded-lg p-4 space-y-4 bg-bg-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Add Domain</h2>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-bg-hover rounded transition-colors">
              <X className="w-4 h-4 text-fg-muted" />
            </button>
          </div>
          <div>
            <label className="block text-xs text-fg-muted mb-1">Domain</label>
            <input
              type="text"
              value={formDomain}
              onChange={(e) => setFormDomain(e.target.value)}
              placeholder="example.com"
              className={inputClass}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={saving || !formDomain.trim()}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add"}
          </button>
        </div>
      )}
      {loading ? (
        <div className="text-sm text-fg-muted py-12 text-center">Loading...</div>
      ) : domains.length === 0 ? (
        <div className="text-sm text-fg-muted py-12 text-center">No domains yet</div>
      ) : (
        <>
        <div className="hidden sm:block border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-subtle border-b border-border">
                <th className="text-left px-3 py-2.5 font-medium text-fg-muted">Domain</th>
                <th className="text-left px-3 py-2.5 font-medium text-fg-muted">Zone ID</th>
                <th className="text-right px-3 py-2.5 font-medium text-fg-muted w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d.id} className="border-b border-border hover:bg-bg-hover transition-colors">
                  <td className="px-3 py-2.5 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-fg-muted" />
                    {d.domain}
                  </td>
                  <td className="px-3 py-2.5 text-fg-muted font-mono text-xs">
                    {d.cf_zone_id || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleToggle(d)} className="p-1.5 rounded hover:bg-bg-hover transition-colors" title={d.enabled ? "Disable" : "Enable"}>
                        {d.enabled ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-fg-muted" />}
                      </button>
                      <button onClick={() => handleDelete(d)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors" title="Delete">
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
          {domains.map((d) => (
            <div key={d.id} className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="w-3.5 h-3.5 text-fg-muted flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{d.domain}</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleToggle(d)} className="p-1.5 rounded hover:bg-bg-hover transition-colors" title={d.enabled ? "Disable" : "Enable"}>
                    {d.enabled ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-fg-muted" />}
                  </button>
                  <button onClick={() => handleDelete(d)} className="p-1.5 rounded hover:bg-red-500/10 transition-colors" title="Delete">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              </div>
              {d.cf_zone_id && <p className="text-xs text-fg-muted font-mono truncate">{d.cf_zone_id}</p>}
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}

