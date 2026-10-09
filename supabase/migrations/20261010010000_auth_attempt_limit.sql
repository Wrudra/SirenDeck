-- Limit sign-in and sign-up to 5 attempts per email per minute.
-- The table is not readable by clients. Only consume_auth_attempt writes it.

create table public.auth_attempts (
  id         bigint generated always as identity primary key,
  email_hash text not null,
  created_at timestamptz not null default now()
);

create index idx_auth_attempts_hash_created
  on public.auth_attempts (email_hash, created_at);

alter table public.auth_attempts enable row level security;

revoke all on public.auth_attempts from anon, authenticated;

create or replace function public.consume_auth_attempt(p_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  hashed text;
  recent int;
begin
  if p_email is null or pg_catalog.length(pg_catalog.btrim(p_email)) = 0 then
    return false;
  end if;

  hashed := pg_catalog.md5(pg_catalog.lower(pg_catalog.btrim(p_email)));

  delete from public.auth_attempts
  where created_at < pg_catalog.now() - interval '1 hour';

  select count(*)::int into recent
  from public.auth_attempts
  where auth_attempts.email_hash = hashed
    and created_at > pg_catalog.now() - interval '1 minute';

  if recent >= 5 then
    return false;
  end if;

  insert into public.auth_attempts (email_hash)
  values (hashed);

  return true;
end;
$$;

revoke all on function public.consume_auth_attempt(text) from public;
grant execute on function public.consume_auth_attempt(text) to anon, authenticated;

-- Counts bypass row level security so the insert policy does not recurse.
create or replace function public.own_storage_object_count()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from storage.objects
  where bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text;
$$;

create or replace function public.own_attachment_count()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.attachments
  where user_id = auth.uid();
$$;

revoke all on function public.own_storage_object_count() from public;
revoke all on function public.own_attachment_count() from public;
grant execute on function public.own_storage_object_count() to authenticated;
grant execute on function public.own_attachment_count() to authenticated;

-- Cap files so one account cannot fill the attachments bucket.
drop policy if exists "attachments_insert_own" on storage.objects;
create policy "attachments_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.own_storage_object_count() < 10
  );

drop policy if exists "insert_own" on public.attachments;
create policy "insert_own" on public.attachments
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and storage_path like (auth.uid()::text || '/%')
    and exists (
      select 1 from public.items i
      where i.id = item_id and i.user_id = auth.uid()
    )
    and public.own_attachment_count() < 10
  );
