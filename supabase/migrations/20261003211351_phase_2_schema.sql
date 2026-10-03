-- SirenDeck Phase 2: baseline hardening + core schema
-- Folds in the original baseline template (privileges, extensions) with all
-- application tables, RLS, indexes, and storage bucket. One file so the
-- remote migration history is a single atomic step from empty -> v1 schema.

-- ===========================================================================
-- 0. Extensions
-- ===========================================================================
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "moddatetime" with schema extensions;

-- ===========================================================================
-- 1. Default privilege hardening (baseline, idempotent)
-- ===========================================================================
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on tables from authenticated;

-- ===========================================================================
-- 2. Helper: updated_at trigger template
-- ===========================================================================
-- Applied per-table below using extensions.moddatetime so RLS still applies
-- and the trigger function runs in a locked search_path.

-- ===========================================================================
-- 3. Tables
-- ===========================================================================

-- 3.1 categories ------------------------------------------------------------
create table public.categories (
  id          uuid primary key default extensions.gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null,   -- urgency-neutral accent; e.g. teal/cyan/amber
  icon        text not null,   -- lucide icon name; resolved in UI
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "select_own" on public.categories
  for select to authenticated using (user_id = auth.uid());
create policy "insert_own" on public.categories
  for insert to authenticated with check (user_id = auth.uid());
create policy "update_own" on public.categories
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete_own" on public.categories
  for delete to authenticated using (user_id = auth.uid());

create index idx_categories_user on public.categories(user_id);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function extensions.moddatetime(updated_at);

-- 3.2 items ------------------------------------------------------------------
create table public.items (
  id              uuid primary key default extensions.gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id     uuid not null references public.categories(id) on delete restrict,
  title           text not null check (char_length(title) between 1 and 120),
  notes           text check (notes is null or char_length(notes) <= 2000),
  due_date        date not null,
  status          text not null default 'active'
                  check (status in ('active', 'snoozed', 'done', 'archived')),
  recurrence      text not null default 'none'
                  check (recurrence in ('none', 'weekly', 'monthly', 'quarterly', 'yearly')),
  auto_renews     boolean not null default false,
  amount          numeric(14, 2) check (amount is null or amount >= 0),
  currency        text not null default 'BDT'
                  check (currency in ('BDT', 'USD', 'EUR')),
  snoozed_until   date check (snoozed_until is null or snoozed_until >= due_date - interval '1 year'),
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Cross-field sanity
  check (snoozed_until is null or status = 'snoozed'),
  check (completed_at is null or status = 'done')
);

alter table public.items enable row level security;

create policy "select_own" on public.items
  for select to authenticated using (user_id = auth.uid());
create policy "insert_own" on public.items
  for insert to authenticated with check (user_id = auth.uid());
create policy "update_own" on public.items
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete_own" on public.items
  for delete to authenticated using (user_id = auth.uid());

-- Map queries: filter by user, then order by due_date asc
create index idx_items_user_due on public.items(user_id, due_date);
-- Status-scoped lookups (e.g. active-only map)
create index idx_items_user_status on public.items(user_id, status);
-- Reminder cron needs (user, status=active, due_date) scans
create index idx_items_user_active_due
  on public.items(user_id, due_date)
  where status = 'active';
-- Category grouping
create index idx_items_user_category on public.items(user_id, category_id);

create trigger items_set_updated_at
  before update on public.items
  for each row execute function extensions.moddatetime(updated_at);

-- 3.3 reminders --------------------------------------------------------------
create table public.reminders (
  id          uuid primary key default extensions.gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id     uuid not null references public.items(id) on delete cascade,
  days_before integer not null check (days_before between 0 and 365),
  sent_at     timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (item_id, days_before)
);

alter table public.reminders enable row level security;

-- For reminders, the auth check must follow the item's ownership: users must
-- only see/manage reminders for items they own.
create policy "select_own" on public.reminders
  for select to authenticated using (user_id = auth.uid());
create policy "insert_own" on public.reminders
  for insert to authenticated with check (user_id = auth.uid());
create policy "update_own" on public.reminders
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete_own" on public.reminders
  for delete to authenticated using (user_id = auth.uid());

-- Cron scan: user_id + sent_at null + joined item due_date window
create index idx_reminders_user_unsent on public.reminders(user_id) where sent_at is null;
create index idx_reminders_item on public.reminders(item_id);

create trigger reminders_set_updated_at
  before update on public.reminders
  for each row execute function extensions.moddatetime(updated_at);

-- 3.4 attachments ------------------------------------------------------------
create table public.attachments (
  id           uuid primary key default extensions.gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id      uuid not null references public.items(id) on delete cascade,
  storage_path text not null,
  filename     text not null,
  mime_type    text not null,
  size_bytes   bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.attachments enable row level security;

create policy "select_own" on public.attachments
  for select to authenticated using (user_id = auth.uid());
create policy "insert_own" on public.attachments
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and storage_path like (auth.uid()::text || '/%')
  );
create policy "update_own" on public.attachments
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete_own" on public.attachments
  for delete to authenticated using (user_id = auth.uid());

create index idx_attachments_user_item on public.attachments(user_id, item_id);
create index idx_attachments_user on public.attachments(user_id);

create trigger attachments_set_updated_at
  before update on public.attachments
  for each row execute function extensions.moddatetime(updated_at);

-- ===========================================================================
-- 4. Default-category seeding (trigger on auth.users)
-- ===========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  defaults text[] := array[
    'Documents', 'Subscriptions', 'Insurance',
    'Warranties', 'Domains & Tech', 'Bills',
    'Licenses', 'Other'
  ];
  icons text[] := array[
    'FileText', 'Repeat', 'Shield', 'Package',
    'Globe', 'Receipt', 'BadgeCheck', 'Folder'
  ];
  colors text[] := array[
    '#4cc2ff', '#7dd3fc', '#a78bfa', '#f0abfc',
    '#5eead4', '#fde68a', '#fca5a5', '#94a3b8'
  ];
  i int;
begin
  for i in 1..array_length(defaults, 1) loop
    insert into public.categories (user_id, name, color, icon)
    values (new.id, defaults[i], colors[i], icons[i]);
  end loop;
  return new;
end;
$$;

-- Trigger must be on auth.users; security definer with locked search_path.
-- Grant insert on categories to the function owner role (postgres already
-- has it; the function runs as security definer).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Default reminder offsets for new items: created by app logic, not DB, so
-- users can customise. (Spec: "Defaults per item: 30, 7, 1.")

-- ===========================================================================
-- 5. Storage bucket: attachments (private, {user_id}/... prefix)
-- ===========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments',
  'attachments',
  false,
  10485760,                              -- 10 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf']
)
on conflict (id) do update
  set public         = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: paths must be prefixed {user_id}/...
drop policy if exists "attachments_select_own"  on storage.objects;
drop policy if exists "attachments_insert_own"  on storage.objects;
drop policy if exists "attachments_update_own"  on storage.objects;
drop policy if exists "attachments_delete_own"  on storage.objects;

create policy "attachments_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "attachments_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "attachments_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "attachments_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ===========================================================================
-- 6. Realtime: subscribe to user's own items + categories
-- ===========================================================================
-- Realtime is enabled per-table; default for new tables is off, so we
-- explicitly add categories and items to the publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'items'
  ) then
    alter publication supabase_realtime add table public.items;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categories'
  ) then
    alter publication supabase_realtime add table public.categories;
  end if;
end$$;
