import { Pool } from "pg";
import bcrypt from "bcryptjs";

async function main() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) {
    console.error("Usage: npx tsx scripts/create-admin.ts <username> <password>");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO admin_users (username, password) VALUES ($1, $2)
     ON CONFLICT (username) DO UPDATE SET password = $2`,
    [username, hash]
  );

  console.log(`Admin user "${username}" created/updated.`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
