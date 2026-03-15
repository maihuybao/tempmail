"use server";

import { pool } from "@/lib/db";
import { signToken, verifyToken } from "@/lib/auth";
import { parseEmailContent } from "@/hooks/parseEmail";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { setupDomainDNS, removeDomainDNS, findZoneId } from "@/lib/cloudflare";

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

export async function listEmails(
  page: number = 1,
  pageSize: number = 30,
  search: string = "",
  sortDir: "ASC" | "DESC" = "DESC"
) {
  await requireAdmin();
  const offset = (page - 1) * pageSize;
  const q = search.trim();

  let dataQuery: string;
  let countQuery: string;
  let params: (string | number)[];
  let countParams: string[];

  if (q) {
    const like = `%${q}%`;
    dataQuery = `SELECT id, date, sender, recipients, data FROM mail
      WHERE sender ILIKE $1 OR recipients ILIKE $1 OR data ILIKE $1
      ORDER BY id ${sortDir} LIMIT $2 OFFSET $3`;
    params = [like, pageSize, offset];
    countQuery = `SELECT COUNT(*)::int AS total FROM mail
      WHERE sender ILIKE $1 OR recipients ILIKE $1 OR data ILIKE $1`;
    countParams = [like];
  } else {
    dataQuery = `SELECT id, date, sender, recipients, data FROM mail ORDER BY id ${sortDir} LIMIT $1 OFFSET $2`;
    params = [pageSize, offset];
    countQuery = "SELECT COUNT(*)::int AS total FROM mail";
    countParams = [];
  }

  const [dataResult, countResult] = await Promise.all([
    pool.query(dataQuery, params),
    pool.query(countQuery, countParams),
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

export async function updateEmail(
  id: number,
  sender: string,
  recipient: string,
  subject: string,
  body: string
) {
  await requireAdmin();
  const row = await pool.query("SELECT date FROM mail WHERE id = $1", [id]);
  if (!row.rows[0]) return { ok: false, error: "Email not found" };
  const date = row.rows[0].date;
  const mime = [
    `From: ${sender}`,
    `To: ${recipient}`,
    `Subject: ${subject}`,
    `Date: ${date}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=UTF-8`,
    "",
    body,
  ].join("\r\n");
  await pool.query(
    "UPDATE mail SET sender = $1, recipients = $2, data = $3 WHERE id = $4",
    [`<${sender}>`, `<${recipient}>`, mime, id]
  );
  return { ok: true };
}

export async function deleteEmails(ids: number[]) {
  await requireAdmin();
  if (ids.length === 0) return { ok: true };
  await pool.query("DELETE FROM mail WHERE id = ANY($1)", [ids]);
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

const VALID_POSITIONS = [
  "home_top", "home_bottom",
  "inbox_top", "inbox_bottom", "inbox_left", "inbox_right",
  "reading_top", "reading_bottom",
];

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

// --- Domains ---

export interface Domain {
  id: number;
  domain: string;
  cf_zone_id: string | null;
  enabled: boolean;
  sort_order: number;
  created_at: string;
}

export async function listDomains(): Promise<Domain[]> {
  await requireAdmin();
  const result = await pool.query(
    "SELECT id, domain, cf_zone_id, enabled, COALESCE(sort_order, id) as sort_order, created_at FROM domains ORDER BY COALESCE(sort_order, id)"
  );
  return result.rows;
}

export async function getActiveDomains(): Promise<string[]> {
  const result = await pool.query(
    "SELECT domain FROM domains WHERE enabled = true ORDER BY COALESCE(sort_order, id)"
  );
  const domains = result.rows.map((r: { domain: string }) => r.domain);
  return domains.length > 0 ? domains : ["foxycrown.net"];
}

export async function addDomain(
  domain: string
): Promise<{ ok: boolean; error?: string; dnsErrors?: string[] }> {
  await requireAdmin();

  const cleanDomain = domain.toLowerCase().trim();
  await pool.query(
    "INSERT INTO domains (domain) VALUES ($1)",
    [cleanDomain]
  );

  const settings = await getSettings();
  if (settings.cf_api_token) {
    const zoneId = await findZoneId(settings.cf_api_token, cleanDomain);
    if (zoneId) {
      await pool.query(
        "UPDATE domains SET cf_zone_id = $1 WHERE domain = $2",
        [zoneId, cleanDomain]
      );
      if (settings.mail_server_host) {
        const dns = await setupDomainDNS(
          settings.cf_api_token,
          zoneId,
          cleanDomain,
          settings.mail_server_host
        );
        if (!dns.ok) return { ok: true, dnsErrors: dns.errors };
      }
    }
  }

  return { ok: true };
}

export async function updateDomain(
  id: number,
  enabled: boolean
): Promise<{ ok: boolean }> {
  await requireAdmin();
  await pool.query("UPDATE domains SET enabled = $1 WHERE id = $2", [enabled, id]);
  return { ok: true };
}

export async function reorderDomains(
  orderedIds: number[]
): Promise<{ ok: boolean }> {
  await requireAdmin();
  for (let i = 0; i < orderedIds.length; i++) {
    await pool.query("UPDATE domains SET sort_order = $1 WHERE id = $2", [i, orderedIds[i]]);
  }
  return { ok: true };
}

export async function deleteDomain(
  id: number,
  removeDNS: boolean = false
): Promise<{ ok: boolean; dnsErrors?: string[] }> {
  await requireAdmin();

  if (removeDNS) {
    const result = await pool.query(
      "SELECT domain, cf_zone_id FROM domains WHERE id = $1",
      [id]
    );
    const row = result.rows[0];
    if (row?.cf_zone_id) {
      const settings = await getSettings();
      if (settings.cf_api_token) {
        const dns = await removeDomainDNS(
          settings.cf_api_token,
          row.cf_zone_id,
          row.domain
        );
        if (!dns.ok) {
          await pool.query("DELETE FROM domains WHERE id = $1", [id]);
          return { ok: true, dnsErrors: dns.errors };
        }
      }
    }
  }

  await pool.query("DELETE FROM domains WHERE id = $1", [id]);
  return { ok: true };
}

// --- Settings ---

export async function getSettings(): Promise<{
  cf_api_token: string;
  mail_server_host: string;
  site_name: string;
  site_logo_url: string;
  site_thumbnail_url: string;
  random_email_length: number;
}> {
  const result = await pool.query(
    "SELECT key, value FROM settings WHERE key IN ('cf_api_token', 'mail_server_host', 'site_name', 'site_logo_url', 'site_thumbnail_url', 'random_email_length')"
  );
  const map: Record<string, string> = {};
  for (const row of result.rows) map[row.key] = row.value;
  return {
    cf_api_token: map.cf_api_token || "",
    mail_server_host: map.mail_server_host || "",
    site_name: map.site_name ?? "",
    site_logo_url: map.site_logo_url || "",
    site_thumbnail_url: map.site_thumbnail_url || "",
    random_email_length: parseInt(map.random_email_length) || 8,
  };
}

export async function saveSettings(
  cfApiToken: string,
  mailServerHost: string,
  siteName: string = "",
  siteLogoUrl: string = "",
  siteThumbnailUrl: string = "",
  randomEmailLength: number = 8
): Promise<{ ok: boolean }> {
  await requireAdmin();
  const pairs: [string, string][] = [
    ["cf_api_token", cfApiToken],
    ["mail_server_host", mailServerHost],
    ["site_name", siteName],
    ["site_logo_url", siteLogoUrl],
    ["site_thumbnail_url", siteThumbnailUrl],
    ["random_email_length", String(Math.max(4, Math.min(20, randomEmailLength)))],
  ];
  for (const [key, value] of pairs) {
    await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2`,
      [key, value]
    );
  }
  return { ok: true };
}

// --- System Stats ---

export interface SystemStats {
  cpu: {
    model: string;
    cores: number;
    usage: number; // percentage
  };
  memory: {
    total: number; // bytes
    used: number;
    free: number;
    usage: number; // percentage
  };
  disk: {
    total: number; // bytes
    used: number;
    free: number;
    usage: number; // percentage
  };
  network: {
    rx: number; // bytes received
    tx: number; // bytes transmitted
  };
  uptime: number; // seconds
  hostname: string;
  platform: string;
}

export async function getSystemStats(): Promise<SystemStats> {
  await requireAdmin();

  const os = await import("os");
  const { execSync } = await import("child_process");

  // CPU usage: sample over 200ms
  const cpus1 = os.cpus();
  await new Promise((r) => setTimeout(r, 200));
  const cpus2 = os.cpus();

  let idleDiff = 0, totalDiff = 0;
  for (let i = 0; i < cpus2.length; i++) {
    const c1 = cpus1[i].times, c2 = cpus2[i].times;
    const t1 = c1.user + c1.nice + c1.sys + c1.idle + c1.irq;
    const t2 = c2.user + c2.nice + c2.sys + c2.idle + c2.irq;
    idleDiff += c2.idle - c1.idle;
    totalDiff += t2 - t1;
  }
  const cpuUsage = totalDiff > 0 ? Math.round((1 - idleDiff / totalDiff) * 1000) / 10 : 0;

  // Memory
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  // Disk
  let diskTotal = 0, diskUsed = 0, diskFree = 0;
  try {
    const df = execSync("df -k / | tail -1", { encoding: "utf-8" }).trim();
    const parts = df.split(/\s+/);
    diskTotal = parseInt(parts[1]) * 1024;
    diskUsed = parseInt(parts[2]) * 1024;
    diskFree = parseInt(parts[3]) * 1024;
  } catch { /* fallback zeros */ }

  // Network (cumulative bytes from /proc/net/dev or netstat)
  let rx = 0, tx = 0;
  try {
    if (os.platform() === "linux") {
      const net = execSync("cat /proc/net/dev", { encoding: "utf-8" });
      for (const line of net.split("\n")) {
        if (line.includes(":") && !line.includes("lo:")) {
          const p = line.split(":")[1].trim().split(/\s+/);
          rx += parseInt(p[0]) || 0;
          tx += parseInt(p[8]) || 0;
        }
      }
    } else {
      const net = execSync("netstat -ib 2>/dev/null | tail -n +2", { encoding: "utf-8" });
      for (const line of net.split("\n")) {
        const p = line.trim().split(/\s+/);
        if (p.length >= 10 && p[0] !== "lo0" && !p[0].startsWith("lo")) {
          rx += parseInt(p[6]) || 0;
          tx += parseInt(p[9]) || 0;
        }
      }
    }
  } catch { /* fallback zeros */ }

  return {
    cpu: { model: cpus1[0]?.model || "Unknown", cores: cpus1.length, usage: cpuUsage },
    memory: { total: totalMem, used: usedMem, free: freeMem, usage: Math.round(usedMem / totalMem * 1000) / 10 },
    disk: { total: diskTotal, used: diskUsed, free: diskFree, usage: diskTotal > 0 ? Math.round(diskUsed / diskTotal * 1000) / 10 : 0 },
    network: { rx, tx },
    uptime: os.uptime(),
    hostname: os.hostname(),
    platform: `${os.platform()} ${os.arch()}`,
  };
}

// --- Email Stats ---

export interface EmailStats {
  today: number;
  week: number;
  month: number;
  total: number;
  dailyCounts: { date: string; count: number }[]; // last 30 days
}

export async function getEmailStats(): Promise<EmailStats> {
  await requireAdmin();

  // Use UTC+7 for date boundaries
  const now = new Date(Date.now() + 7 * 3600_000);
  const y = now.getUTCFullYear(), mo = now.getUTCMonth(), d = now.getUTCDate();
  const todayStart = new Date(Date.UTC(y, mo, d) - 7 * 3600_000).toISOString();
  const dow = now.getUTCDay(); // 0=Sun
  const weekStart = new Date(Date.UTC(y, mo, d - (dow === 0 ? 6 : dow - 1)) - 7 * 3600_000).toISOString();
  const monthStart = new Date(Date.UTC(y, mo, 1) - 7 * 3600_000).toISOString();

  const tz = "SET LOCAL timezone = 'Asia/Ho_Chi_Minh'";

  const [todayR, weekR, monthR, totalR, dailyR] = await Promise.all([
    pool.query("SELECT COUNT(*)::int AS c FROM mail WHERE date >= $1", [todayStart]),
    pool.query("SELECT COUNT(*)::int AS c FROM mail WHERE date >= $1", [weekStart]),
    pool.query("SELECT COUNT(*)::int AS c FROM mail WHERE date >= $1", [monthStart]),
    pool.query("SELECT COUNT(*)::int AS c FROM mail"),
    (async () => {
      const client = await pool.connect();
      try {
        await client.query(tz);
        return await client.query(
          `SELECT d::date::text AS date, COUNT(m.id)::int AS count
           FROM generate_series(
             (CURRENT_DATE - INTERVAL '29 days')::date,
             CURRENT_DATE::date,
             '1 day'::interval
           ) AS d
           LEFT JOIN mail m ON (m.date::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')::date = d::date
           GROUP BY d::date ORDER BY d::date`
        );
      } finally {
        client.release();
      }
    })(),
  ]);

  return {
    today: todayR.rows[0].c,
    week: weekR.rows[0].c,
    month: monthR.rows[0].c,
    total: totalR.rows[0].c,
    dailyCounts: dailyR.rows,
  };
}

export async function getSiteConfig(): Promise<{
  site_name: string;
  site_logo_url: string;
  site_thumbnail_url: string;
  random_email_length: number;
}> {
  const result = await pool.query(
    "SELECT key, value FROM settings WHERE key IN ('site_name', 'site_logo_url', 'site_thumbnail_url', 'random_email_length')"
  );
  const map: Record<string, string> = {};
  for (const row of result.rows) map[row.key] = row.value;
  return {
    site_name: map.site_name ?? "",
    site_logo_url: map.site_logo_url || "",
    site_thumbnail_url: map.site_thumbnail_url || "",
    random_email_length: parseInt(map.random_email_length) || 8,
  };
}
