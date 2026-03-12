import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT domain FROM domains WHERE enabled = true ORDER BY id"
    );
    const domains = result.rows.map((r: { domain: string }) => r.domain);
    return NextResponse.json({ ok: true, domains });
  } catch (error) {
    console.error("API domains error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
