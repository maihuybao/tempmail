import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const [domainResult, settingResult] = await Promise.all([
      pool.query("SELECT domain FROM domains WHERE enabled = true ORDER BY id"),
      pool.query("SELECT value FROM settings WHERE key = 'random_email_length'"),
    ]);
    const domains = domainResult.rows.map((r: { domain: string }) => r.domain);
    if (domains.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No active domains available" },
        { status: 503 }
      );
    }

    const len = parseInt(settingResult.rows[0]?.value) || 8;
    const username = Math.random().toString(36).slice(2, 2 + len);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const email = `${username}@${domain}`;

    return NextResponse.json({ ok: true, email, username, domain });
  } catch (error) {
    console.error("API generate error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
