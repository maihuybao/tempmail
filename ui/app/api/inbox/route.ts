import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { parseEmailContent } from "@/hooks/parseEmail";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid 'email' query parameter (e.g. ?email=user@domain.com)" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      "SELECT date, sender, recipients, data FROM mail WHERE recipients = $1 ORDER BY date DESC",
      [`<${email}>`]
    );

    const emails = [];
    for (const row of result.rows) {
      const parsed = await parseEmailContent(row.data);
      emails.push({
        date: row.date,
        sender: row.sender,
        recipients: row.recipients,
        subject: parsed.subject,
        from: parsed.from,
        text: parsed.text,
        html: parsed.html,
      });
    }

    return NextResponse.json({ ok: true, count: emails.length, emails });
  } catch (error) {
    console.error("API inbox error:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
