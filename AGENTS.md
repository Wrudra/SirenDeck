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
- **Auth**: email + password (existing). Magic link + Google OAuth were considered and dropped for v1.
- **Default currency**: BDT (৳) at the DB level; per-item override + settings page later.
- **Migrations**: baseline hardening + Phase 2 tables in one migration; template file deleted.
- **Skills CLI**: `npx skills add` skipped; guidelines below are the distilled versions.

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
9. After each UI phase, run the web-design-guidelines audit (below) and fix findings before reporting.

## Distilled guidelines

### Frontend (from vercel-labs/web-interface-guidelines)
- **Interactive elements must do something on focus-visible**: never `outline: none` without replacement; 2px+ focus ring with 2px offset, visible against all backgrounds.
- **Hit areas**: interactive targets ≥ 24px (ideally 40px+). No double-tap zoom on mobile (≥44px or `touch-action: manipulation`).
- **Keyboard**: full flow operable by keyboard. Esc closes overlays. Arrow keys move focus in tile grid. Visually hidden mirror of the treemap for screen readers.
- **Forms**: labels on every field; errors tied to inputs via `aria-describedby`; never rely on color alone (pair with icon/text).
- **Motion**: serve the user's preference — `prefers-reduced-motion` kills pulses/shimmers/staggers; keep simple fades only.
- **Contrast**: WCAG AA minimum (4.5:1 text). Tile text must stay readable on every urgency color.
- **Never** trap scroll, hijack scroll, or use `100vh` on mobile (use `dvh`).
- **No layout shift**: skeleton loaders match final size; min visible time ~300ms to avoid flicker.
- **Images**: `width`+`height` always; lazy below the fold.
- **Animation perf**: `transform`/`opacity` only; 60fps budget; no main-thread layout thrash during tile reflow.

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
