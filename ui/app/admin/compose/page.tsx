"use client";

import { useState } from "react";
import { insertEmail } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { inputClass } from "@/lib/ui";
import { toast } from "sonner";

export default function AdminComposePage() {
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await insertEmail(sender, recipient, subject, body);
      toast.success("Email created");
      setTimeout(() => router.push("/admin/emails"), 1000);
    } catch {
      toast.error("Failed to create email");
      setStatus("idle");
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-lg font-semibold mb-6">Compose Email</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-fg-muted mb-1">From</label>
          <input
            type="text"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="sender@example.com"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-fg-muted mb-1">To</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="user@foxycrown.net"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-fg-muted mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-fg-muted mb-1">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Email body..."
            rows={10}
            required
            className={inputClass + " resize-y"}
          />
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="px-5 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors text-sm disabled:opacity-50"
        >
          {status === "sending" ? "Sending..." : "Create Email"}
        </button>
      </form>
    </div>
  );
}
