# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this

Self-hosted temporary email service. Rust SMTP server receives mail and stores it in Postgres. Next.js 15 frontend reads directly from the same Postgres database via server actions (no HTTP API between them). Emails auto-delete after 7 days. Domain: `flux.shubh.sh`.

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

### Environment variables
Rust backend needs: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `MAIL_DOMAIN` (see `.env.sample`)
Next.js frontend needs: `DATABASE_URL` (Postgres connection string), `NEXT_PUBLIC_EMAIL_DOMAIN` (e.g. `flux.shubh.sh`) (see `ui/.env.example`)

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

### Database schema (auto-created in `crates/database/src/database.rs`)
- `mail` — `date TEXT, sender TEXT, recipients TEXT, data TEXT` (raw MIME in `data`)
- `quota` — per-address rate limiting (`address, quota_limit, completed`)
- `user_config` — webhook config per mail address, FK to `quota.address`

### Frontend data flow
`ui/app/actions/actions.ts` queries Postgres directly via `pg` Pool (`ui/lib/db.ts`). The server action wraps the recipient in angle brackets (`<user@domain>`) to match how SMTP stores them — this is a common gotcha when debugging missing emails. Raw MIME from the `data` column is parsed using `mailparser` (`ui/hooks/parseEmail.ts`). No API routes exist — everything goes through Next.js server actions.

### Frontend structure
- `ui/app/page.tsx` — home page (client component): username input → navigates to `/search?q=<username>`
- `ui/app/search/SearchResults.tsx` — main inbox UI (client component): two-panel email list + detail view
- `ui/components/EmailDetail.tsx` — renders HTML email body via `dangerouslySetInnerHTML`, falls back to `<pre>` for plain text
- `ui/contexts/ThemeContext.tsx` — `ThemeProvider` + `useTheme` hook, persists to localStorage, toggles `.dark` class on `<body>`
- `ui/styles/globals.css` + `ui/tailwind.config.ts` — CSS custom properties for light/dark themes, Tailwind maps color tokens to CSS vars

### Key constants
- Max email size: 10 MB (`crates/smtp/src/lib.rs`)
- Max recipients per message: 100
- Connection timeout: 300s per SMTP session, 30s per read
- Old mail cleanup: background thread in `main.rs` calls `clear_old_mails` every 3600s (deletes mail older than 7 days)

### Domain configuration
Both domains are configured via environment variables:
- SMTP domain: `MAIL_DOMAIN` env var in Rust backend (used in `crates/smtp/src/main.rs`)
- UI domain: `NEXT_PUBLIC_EMAIL_DOMAIN` env var in Next.js frontend (used in `ui/app/search/SearchResults.tsx`)

### Deployment
- SMTP server: VPS with systemd, or via nixpacks (`nixpacks.toml` exposes port 25)
- Frontend: Vercel (root dir `ui`) or self-hosted with Nginx reverse proxy
- Full deployment guide: `DEPLOY.md` (PostgreSQL → SMTP → Web UI → Nginx/SSL → DNS)
