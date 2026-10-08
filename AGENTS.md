# AGENTS.md — SirenDeck Working Rules

## What this is
A personal life-admin tracker for everything that expires, renews, or comes due
(subscriptions, insurance, domains, warranties, licenses, bills, passports/visas).
One signature view: the **Money Map** — a treemap where each rectangle is a deadline,
sized by monthly/yearly cost and colored by urgency. It must answer at a glance:
"What is renewing soon, and what does it cost me?"

## Stack (fixed — do not substitute)
- Next.js (App Router) + TypeScript (strict) — pnpm
- Tailwind CSS + shadcn/ui primitives only (dialog, input, dropdown, toast)
- Motion (package `motion`, import from `"motion/react"`) — the ONLY animation library
- `d3-hierarchy` for treemap layout math only (no D3 DOM rendering)
- Supabase: Auth, Postgres, RLS, Storage, Edge Functions, pg_cron
- `@supabase/supabase-js` + `@supabase/ssr` (server + browser clients, middleware session refresh)
- Zod validation
- Deploy: Vercel. No vector/embedding/AI features in v1.

## Decisions log
- **Auth**: email + password. Confirmation redirects use `NEXT_PUBLIC_SITE_URL`, never the request host.
- **Default currency**: BDT (৳) at the DB level; per-item override + settings page later.
- **Migrations**: baseline hardening + Phase 2 tables in one migration; template file deleted.
- **Skills CLI**: `npx skills add` skipped; see "Design skills" below.
- **Design skills**: golden standard = Owl-Listener/designer-skills + elayadesign/ai-design-skills ONLY (vendored subset in `docs/design-skills/`). All prior design-guideline sources removed.

## Working rules
0. Commits are authored by the repo owner ONLY — NEVER add `Co-authored-by:` trailers (including Copilot) or any other contributor attribution. No exceptions.
1. Work in PHASES. After each phase, stop, summarize, list verification steps, wait for "continue".
2. Before using a library API, check its current docs. If a command fails, read the error and fix it — don't guess.
3. All schema changes via migration files in `supabase/migrations/`. Never dashboard edits.
4. RLS on EVERY table with explicit policies, `with check` on writes. Views use `security_invoker = true`. Never authorize on user-editable metadata.
5. Never expose the service role key. Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` only. Keep `.env.example` current.
6. Animate `transform`/`opacity`; Motion layout animations for tile size/position changes (never animate width/height). Respect `prefers-reduced-motion` (instant layout, no pulses, simple fades).
7. Server Components by default; Client Components only for interactivity/animation.
8. Small typed reusable components; small logical changes; don't rewrite unrelated files.
9. After each UI phase, run the design audit using `docs/design-skills/owl-listener/critique-visual-hierarchy.md` + `accessibility-audit.md` (fix findings before reporting).

## Design skills (the golden standard)

Only two sources, vendored in [docs/design-skills/](docs/design-skills):

- **Owl-Listener/designer-skills** — 16 of 111 skills curated for SirenDeck (dataviz, color, type, spacing, hierarchy, dark mode, forms, loading, feedback, errors, search, micro-interactions, motion, a11y, critique). Full index: <https://github.com/Owl-Listener/designer-skills>
- **elayadesign/ai-design-skills** — `landing-page-design` (login/landing surfaces).

Rules: consult these BEFORE any design decision. Anything not covered → fetch the sibling skill from upstream, never invent or use other collections. Both MIT; attribution in `docs/design-skills/README.md`.

### Supabase Postgres (from supabase-postgres-best-practices)
- Policy shape: one policy per action per table, named `"<action>_own"`: `for select to authenticated using (user_id = auth.uid())`; for insert/update `with check (user_id = auth.uid())`; delete requires ownership via subquery on parent where applicable.
- Security definer functions must set `search_path = ''`; grant no privileged helpers to exposed roles.
- Indexes: composite `(user_id, due_date)` for map queries, `(user_id, cron)` for reminder scanning; consider partial `where status = 'active'` when the map only shows active.
- `numeric` for money (never float). `date` for due dates (never timestamptz). Storage paths prefixed `{user_id}/`.
- Views: `security_invoker = true` always, or rows leak across users.
- updated_at via trigger (`moddatetime` extension) — never trust the client.
- Enum-like values via CHECK constraints or Postgres enums; prefer CHECKs for evolvability.
- Every table gets `user_id uuid not null default auth.uid()` referencing `auth.users`.

## Folder structure
```
src/
  app/                  routes
    (auth)/login        auth pages
    app/                protected app shell (Money Map canvas)
  components/           shared components
  lib/
    supabase/           clients + middleware session refresh
    urgency.ts          getUrgency + levels
    money.ts            yearlyCost, formatting
    validation/         Zod schemas
  docs/                 design plan
supabase/
  migrations/           SQL migrations (source of truth)
  functions/            Edge Functions (send-reminders)
```

## Naming conventions
- Components: PascalCase files matching export (`money-map.tsx` → `MoneyMap`).
- Server actions: camelCase verbs (`addItem`, `updateItem`, `markDone`, `snoozeItem`).
- DB: snake_case tables/columns; policies `<action>_own`; indexes `idx_<table>_<cols>`.
- Migrations: `<yyyymmddhhmmss>_<description>.sql` (Supabase CLI convention).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
