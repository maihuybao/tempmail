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

  console.log("Migrations complete");
}
