-- SirenDeck Phase 6: reminder scheduling
--
-- 1. Enables pg_cron + pg_net (Supabase-hosted; both use `extensions`).
-- 2. Creates a helper that returns unsent, due reminders joined with item +
--    owner email, callable by the service role only.
-- 3. Schedules hourly cron that invokes the send-reminders Edge Function via
--    Vault secrets (the canonical hosted pattern — `app.settings.*` settings
--    do not exist on Supabase hosting). The schedule is inert until the
--    function's REMINDER_MODE leaves "log"; in log mode it records what it
--    would send and marks reminders sent.
--
-- The cron job and helper are service-role only; RLS stays intact for all
-- user-facing tables. Explicit grants: none to anon/authenticated.
--
-- SETUP (one-time, owner-manual, values never committed):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service-role-key>', 'service_role_key');

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- ─────────────────────────────────────────────────────────────────────────────
-- Due-reminder view for the cron worker (service-role only)
-- security_invoker = false (default for security definer usage below); access
-- is gated by function ownership + revoke from public roles instead.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.due_reminders()
returns table (
  reminder_id uuid,
  user_id     uuid,
  item_id     uuid,
  user_email  text,
  item_title  text,
  due_date    date,
  days_before integer,
  amount      numeric,
  currency    text
)
language sql
security definer
set search_path = ''
as $$
  select r.id, r.user_id, r.item_id, u.email, i.title, i.due_date,
         r.days_before, i.amount, i.currency
  from public.reminders r
  join public.items i on i.id = r.item_id
  join auth.users u on u.id = r.user_id
  where r.sent_at is null
    and i.status = 'active'
    and i.due_date - r.days_before <= current_date
    and i.due_date >= current_date - 30  -- skip stale overdues
  order by i.due_date asc;
$$;

revoke all on function public.due_reminders() from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Hourly HTTP call to the Edge Function. Hosted Supabase has no
-- `app.settings.supabase_url` / `app.settings.service_role_key`, so the URL
-- and Bearer key come from Vault secrets (see SETUP above). The function is
-- idempotent (marks reminders sent in the same run), so a repeated call
-- is safe.
-- ─────────────────────────────────────────────────────────────────────────────
select cron.schedule(
  'send-reminders-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
               || '/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);
