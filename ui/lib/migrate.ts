import { pool } from "./db";

export async function runMigrations() {
  try {
    await pool.query(`
      ALTER TABLE mail ADD COLUMN IF NOT EXISTS id BIGSERIAL PRIMARY KEY
    `);
  } catch (e: unknown) {
    // Column may already exist or table may already have a PK
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("already exists")) {
      console.error("Migration warning (mail.id):", msg);
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id         BIGSERIAL PRIMARY KEY,
      position   TEXT NOT NULL,
      content    TEXT NOT NULL,
      enabled    BOOLEAN NOT NULL DEFAULT true,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS domains (
      id         BIGSERIAL PRIMARY KEY,
      domain     TEXT NOT NULL UNIQUE,
      cf_zone_id TEXT,
      enabled    BOOLEAN NOT NULL DEFAULT true,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Add sort_order to domains if missing (existing DBs)
  await pool.query(`
    ALTER TABLE domains ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0
  `);

  console.log("Migrations complete");
}
