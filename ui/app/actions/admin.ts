"use server";

import { pool } from "@/lib/db";
import { signToken, verifyToken } from "@/lib/auth";
import { parseEmailContent } from "@/hooks/parseEmail";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "admin_token";

// --- Auth ---

export async function adminLogin(username: string, password: string) {
  const result = await pool.query(
    "SELECT id, username, password FROM admin_users WHERE username = $1",
    [username]
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { ok: false, error: "Invalid credentials" };
  }

  const token = await signToken({
    sub: String(user.id),
    username: user.username,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24h
    path: "/",
  });

  return { ok: true };
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin/login");
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) throw new Error("Unauthorized");
  const payload = await verifyToken(token);
  if (!payload) throw new Error("Unauthorized");
  return payload;
}

// --- Emails ---

export async function listEmails(page: number = 1, pageSize: number = 30) {
  await requireAdmin();
  const offset = (page - 1) * pageSize;

  const [dataResult, countResult] = await Promise.all([
    pool.query(
      "SELECT id, date, sender, recipients, data FROM mail ORDER BY date DESC LIMIT $1 OFFSET $2",
      [pageSize, offset]
    ),
    pool.query("SELECT COUNT(*)::int AS total FROM mail"),
  ]);

  const emails = [];
  for (const row of dataResult.rows) {
    const parsed = await parseEmailContent(row.data);
    emails.push({
      id: row.id as number,
      date: row.date as string,
      sender: row.sender as string,
      recipients: row.recipients as string,
      data: {
        subject: parsed.subject,
        from: parsed.from,
        text: parsed.text,
        html: parsed.html,
        text_as_html: parsed.text_as_html,
        date: parsed.date.toISOString(),
      },
    });
  }

  return {
    emails,
    total: countResult.rows[0].total as number,
    page,
    pageSize,
  };
}

export async function getEmail(id: number) {
  await requireAdmin();
  const result = await pool.query(
    "SELECT id, date, sender, recipients, data FROM mail WHERE id = $1",
    [id]
  );
  return result.rows[0] || null;
}

export async function deleteEmail(id: number) {
  await requireAdmin();
  await pool.query("DELETE FROM mail WHERE id = $1", [id]);
  return { ok: true };
}

export async function deleteEmails(ids: number[]) {
  await requireAdmin();
  if (ids.length === 0) return { ok: true };
  await pool.query("DELETE FROM mail WHERE id = ANY($1)", [ids]);
  return { ok: true };
}

export async function insertEmail(
  sender: string,
  recipient: string,
  subject: string,
  body: string
) {
  await requireAdmin();
  const now = new Date().toUTCString();
  const mime = [
    `From: ${sender}`,
    `To: ${recipient}`,
    `Subject: ${subject}`,
    `Date: ${now}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    "",
    body,
  ].join("\r\n");

  await pool.query(
    "INSERT INTO mail (date, sender, recipients, data) VALUES ($1, $2, $3, $4)",
    [now, `<${sender}>`, `<${recipient}>`, mime]
  );
  return { ok: true };
}

// --- Banners ---

export interface Banner {
  id: number;
  position: string;
  content: string;
  enabled: boolean;
  sort_order: number;
}

const VALID_POSITIONS = ["home_top", "home_bottom", "inbox_top", "inbox_bottom"];

export async function getBannersByPosition(position: string): Promise<Banner[]> {
  const result = await pool.query(
    "SELECT id, position, content, enabled, sort_order FROM banners WHERE position = $1 AND enabled = true ORDER BY sort_order ASC, id ASC",
    [position]
  );
  return result.rows;
}

export async function listBanners(): Promise<Banner[]> {
  await requireAdmin();
  const result = await pool.query(
    "SELECT id, position, content, enabled, sort_order FROM banners ORDER BY position, sort_order, id"
  );
  return result.rows;
}

export async function upsertBanner(
  id: number | null,
  position: string,
  content: string,
  enabled: boolean,
  sort_order: number
) {
  await requireAdmin();
  if (!VALID_POSITIONS.includes(position)) {
    return { ok: false, error: "Invalid position" };
  }
  if (id) {
    await pool.query(
      "UPDATE banners SET position=$1, content=$2, enabled=$3, sort_order=$4 WHERE id=$5",
      [position, content, enabled, sort_order, id]
    );
  } else {
    await pool.query(
      "INSERT INTO banners (position, content, enabled, sort_order) VALUES ($1, $2, $3, $4)",
      [position, content, enabled, sort_order]
    );
  }
  return { ok: true };
}

export async function deleteBanner(id: number) {
  await requireAdmin();
  await pool.query("DELETE FROM banners WHERE id = $1", [id]);
  return { ok: true };
}
