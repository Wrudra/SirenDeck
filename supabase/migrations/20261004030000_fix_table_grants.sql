-- SirenDeck fix: restore table privileges for the app roles.
--
-- The Phase 2 migration revoked default privileges BEFORE creating the app
-- tables, so categories/items/reminders/attachments ended up with zero grants
-- for authenticated. RLS policies alone do not confer table access; every
-- app query failed with "permission denied for table X" (42501).
--
-- Restores the standard Supabase split:
--   authenticated: select/insert/update/delete (rows still filtered by RLS)
--   anon:          none (all policies require auth.uid(); anon never needs
--                  direct table access in this app)
--
-- Idempotent: re-running is a no-op.

grant select, insert, update, delete on public.categories to authenticated;

grant select, insert, update, delete on public.items to authenticated;

grant select, insert, update, delete on public.reminders to authenticated;

grant select, insert, update, delete on public.attachments to authenticated;

-- Keep the original hardening intent for FUTURE tables: authenticated gets
-- app-level CRUD via default privileges; anon stays revoked.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
