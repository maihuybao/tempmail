# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this

Self-hosted temporary email service. Rust SMTP server receives mail and stores it in Postgres. Next.js 15 frontend reads directly from the same Postgres database via server actions + REST API routes. Emails auto-delete after 7 days. Multi-domain support managed through an admin panel.

## Build & Run

### Rust backend (SMTP server)
```bash
cargo build                    # build all crates
cargo run -p flux-mail         # run SMTP server (binds 0.0.0.0:25)
cargo test --verbose           # run tests (currently no test cases exist)
cargo clippy                   # lint
cargo fmt --check              # check formatting
```

### Next.js frontend
```bash
cd ui
pnpm install
pnpm dev                       # dev server
pnpm build                     # production build
pnpm lint                      # ESLint (next/core-web-vitals + next/typescript, flat config)
```

### Create admin user
```bash
cd ui
npx tsx scripts/create-admin.ts <username> <password>
```

### Environment variables
Rust backend: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `MAIL_DOMAIN`
Next.js frontend: `DATABASE_URL` (Postgres connection string), `ADMIN_JWT_SECRET` (for admin auth, falls back to `"change-me-in-production"`)

`NEXT_PUBLIC_EMAIL_DOMAIN` is deprecated — domains are now managed via the admin panel and stored in the `domains` DB table.

## CI

GitHub Actions (`.github/workflows/rust.yml`) runs on push/PR to `master`: `cargo build --verbose` → `cargo test --verbose`. No frontend CI.

## Architecture

### Crate dependency graph
```
flux-mail (crates/smtp) — SMTP binary, the main entrypoint
  ├── flux-database (crates/database) — Postgres client, schema init, queries
  │     └── flux-types (crates/types) — Email struct, SMTP state machine, error types
  └── flux-types

flux-http (crates/http) — standalone webhook sender (reqwest), no internal deps
```

### SMTP state machine (`crates/types/src/types.rs`, `crates/smtp/src/smtp.rs`)
`CurrentStates` enum drives the SMTP conversation:
```
Initial → (EHLO/HELO) → Greeted → (MAIL FROM) → AwaitingRecipient
→ (RCPT TO, repeatable) → AwaitingRecipient → (DATA) → AwaitingData
→ (body terminated by \r\n.\r\n) → DataReceived → saves to DB
```

### Database schema

Rust backend creates (in `crates/database/src/database.rs`):
- `mail` — `id BIGSERIAL, date TEXT, sender TEXT, recipients TEXT, data TEXT` (raw MIME in `data`)
- `quota` — per-address rate limiting (`address, quota_limit, completed`)
- `user_config` — webhook config per mail address, FK to `quota.address`

Next.js creates on startup via `instrumentation.ts` → `lib/migrate.ts`:
- `admin_users` — `id, username, password (bcrypt), created_at`
- `banners` — `id, position, content (HTML), enabled, sort_order, created_at`
- `domains` — `id, domain, cf_zone_id, enabled, sort_order, created_at`
- `settings` — `key TEXT PK, value TEXT` (KV store for site config)

### Frontend data flow
`ui/app/actions/actions.ts` queries Postgres directly via `pg` Pool (`ui/lib/db.ts`). The server action wraps the recipient in angle brackets (`<user@domain>`) to match how SMTP stores them — this is a common gotcha when debugging missing emails. Raw MIME from the `data` column is parsed using `mailparser` (`ui/hooks/parseEmail.ts`).

### Domain configuration
Domains are stored in the `domains` table and managed through `/admin/domains`. `getActiveDomains()` queries enabled domains ordered by `sort_order` and falls back to `"foxycrown.net"` if the table is empty. The SMTP backend still uses the `MAIL_DOMAIN` env var independently.

When adding a domain via admin, if a Cloudflare API token and zone ID are configured (`ui/lib/cloudflare.ts`), MX and SPF DNS records are created automatically.

### Admin panel (`/admin/*`)
JWT-based auth (jose HS256, 24h expiry, `admin_token` cookie). Middleware in `ui/middleware.ts` protects all `/admin/*` routes except `/admin/login`.

Pages:
- `/admin/emails` — paginated email list, search, sort, bulk delete, edit
- `/admin/domains` — add/enable/disable/reorder/delete domains, optional Cloudflare DNS automation
- `/admin/banners` — CRUD for HTML banner slots (8 positions: `home_top`, `home_bottom`, `inbox_top`, `inbox_bottom`, `inbox_left`, `inbox_right`, `reading_top`, `reading_bottom`)
- `/admin/settings` — Cloudflare API token, mail server hostname, site name, logo URL, thumbnail URL, random email length

### REST API routes (documented in `API.md`)
- `GET /api/inbox?email=user@domain.com` — fetch parsed emails for an address
- `GET /api/domains` — list active domains
- `GET /api/generate` — generate random email (respects `random_email_length` setting)

### Frontend pages
- `/` — home: username input + domain picker dropdown, navigates to `/search?q=<username>&d=<domain>`
- `/search` — inbox UI (`SearchResults.tsx`): two-panel email list + detail view, pagination (20/page)
- `/docs` — API documentation
- `/contact` — contact page with Telegram handles

### Site config
`site_name`, `site_logo_url`, `site_thumbnail_url`, `random_email_length` are stored in the `settings` table. Root layout's `generateMetadata()` pulls these for dynamic OG/Twitter meta tags.

### Banner system
`ui/components/BannerSlot.tsx` renders HTML banners from DB at named positions. Banners can contain `<script>` tags (re-injected as live script elements). Used in `page.tsx` and `SearchResults.tsx`.

### Key constants
- Max email size: 10 MB (`crates/smtp/src/lib.rs`)
- Max recipients per message: 100
- Connection timeout: 300s per SMTP session, 30s per read
- Old mail cleanup: background thread in `main.rs` calls `clear_old_mails` every 3600s (deletes mail older than 7 days)

### Deployment
- SMTP server: VPS with systemd, or via nixpacks (`nixpacks.toml` exposes port 25)
- Frontend: Vercel (root dir `ui`) or self-hosted with Nginx reverse proxy
- Full deployment guide: `DEPLOY.md` (PostgreSQL → SMTP → Web UI → Nginx/SSL → DNS)
