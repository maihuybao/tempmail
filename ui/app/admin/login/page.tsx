"use client";

import { useEffect, useState } from "react";
import { adminLogin, getSiteConfig } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { inputClass } from "@/lib/ui";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [siteName, setSiteName] = useState("");
  const router = useRouter();

  useEffect(() => {
    getSiteConfig().then((c) => setSiteName(c.site_name));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await adminLogin(username, password);
      if (result.ok) {
        router.push("/admin/emails");
      } else {
        toast.error(result.error || "Login failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Mail className="w-7 h-7 text-accent" />
            <h1 className="text-2xl font-semibold">Admin</h1>
          </div>
          <p className="text-fg-muted text-sm">Sign in to manage {siteName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors text-sm disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
