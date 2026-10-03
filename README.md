# SirenDeck

Next.js (App Router, TypeScript) + Supabase, deployed on Vercel.

## Stack

- **Next.js 16** — App Router, TypeScript, Tailwind CSS 4, pnpm
- **Supabase** — Postgres, Auth (email/password), Row Level Security
- **Vercel** — hosting; Supabase Marketplace integration injects env vars

## Layout

```
src/
  app/                  routes (login, signup, auth callback, api/auth)
  components/           shared server components (AuthGate)
  lib/supabase/         clients: browser, server (cookies), middleware session refresh
supabase/
  migrations/           SQL migrations (RLS-first baseline included)
  config.toml           Supabase CLI project config
```

## Auth flow

- `@supabase/ssr` cookie-based sessions; `src/middleware.ts` refreshes tokens on every request.
- Email confirmation links land on `/auth/callback`, which exchanges the code for a session.
- Sign-in/up handled by `POST /api/auth?mode=signin|signup`; sign-out by `POST /api/auth/signout`.

## Environment

| Variable | Where | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL` | Vercel (integration) + `.env.local` | public by design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY` | same | publishable key, protected by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` | Vercel only | server-only, never commit |

Local: `vercel env pull .env.local --yes` (Sensitive vars are excluded from pulls; the
`NEXT_PUBLIC_*` fallbacks cover local development).

## Database workflow

Migrations are the source of truth. Create with
`supabase migration new <name>`, apply with `supabase db push`.
Every table must enable RLS before exposure — see the baseline migration.

## Branching

`main` is protected: changes land via pull request (no approval required,
linear history enforced, force-pushes blocked). PR merges auto-deploy to Vercel.
