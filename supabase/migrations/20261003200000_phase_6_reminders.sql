-- SirenDeck Phase 6: reminder scheduling
--
-- 1. Enables pg_cron (Supabase-hosted; uses the `extensions` schema).
-- 2. Creates a helper that returns unsent, due reminders joined with item +
--    owner email, callable by the service role only.
-- 3. Schedules hourly cron that invokes the send-reminders Edge Function.
--    The schedule itself is inert until the function's REMINDER_MODE leaves
--    "log" — the function logs what it would send and marks reminders sent.
--
-- The cron job and helper are service-role only; RLS stays intact for all
-- user-facing tables. Explicit grants: none to anon/authenticated.

create extension if not exists pg_cron with schema extensions;

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
-- Hourly HTTP call to the Edge Function.
-- SUPABASE_URL is injected by the pg_cron environment on Supabase hosting.
-- The function is idempotent (marks reminders sent in the same run), so a
-- repeated call is safe.
-- ─────────────────────────────────────────────────────────────────────────────
select cron.schedule(
  'send-reminders-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url     := current_setting('app.settings.supabase_url', true)
               || '/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);
