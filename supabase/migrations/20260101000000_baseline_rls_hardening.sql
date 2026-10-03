-- SirenDeck baseline: security hardening applied at project creation.
-- Safe to run on an empty database. All future migrations must keep RLS on
-- for every table in schemas exposed by PostgREST (public, etc.).

-- Extension for id/existence helpers (idempotent).
create extension if not exists "pgcrypto" with schema extensions;

-- ---------------------------------------------------------------------------
-- Harden default privileges: new tables in `public` start with no
-- anon/authenticated grants, so access must be granted deliberately.
-- ---------------------------------------------------------------------------
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on tables from authenticated;

-- ---------------------------------------------------------------------------
-- Example pattern only — copy when the first real table ships.
-- ---------------------------------------------------------------------------
-- create table public.example (
--   id uuid primary key default extensions.gen_random_uuid(),
--   owner_id uuid not null default auth.uid(),
--   title text not null,
--   created_at timestamptz not null default now(),
--   updated_at timestamptz not null default now()
-- );
--
-- alter table public.example enable row level security;
--
-- -- Users can see only their own rows.
-- create policy "select_own" on public.example
--   for select to authenticated
--   using (owner_id = auth.uid());
--
-- create policy "insert_own" on public.example
--   for insert to authenticated
--   with check (owner_id = auth.uid());
