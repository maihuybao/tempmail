"use client";

import { useEffect, useState } from "react";
import { getSettings, saveSettings } from "@/app/actions/admin";
import { Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [cfToken, setCfToken] = useState("");
  const [mailHost, setMailHost] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getSettings().then((s) => {
      setCfToken(s.cf_api_token);
      setMailHost(s.mail_server_host);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    await saveSettings(cfToken, mailHost);
    setSaving(false);
    setMsg("Saved");
    setTimeout(() => setMsg(""), 2000);
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-border bg-bg text-fg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors";

  if (loading) {
    return <div className="p-6 text-sm text-fg-muted">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-lg">
      <h1 className="text-lg font-semibold">Settings</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-fg-muted mb-1">
            Cloudflare API Token
          </label>
          <input
            type="password"
            value={cfToken}
            onChange={(e) => setCfToken(e.target.value)}
            placeholder="CF API token"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-fg-muted mb-1">
            Mail Server Hostname
          </label>
          <input
            type="text"
            value={mailHost}
            onChange={(e) => setMailHost(e.target.value)}
            placeholder="mail.foxycrown.net"
            className={inputClass}
          />
          <p className="text-xs text-fg-muted mt-1">
            IP or hostname of your SMTP server (used for MX records)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save"}
          </button>
          {msg && <span className="text-sm text-accent">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
