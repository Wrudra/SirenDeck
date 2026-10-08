-- Bind related rows to the same owner.
-- Item category, reminder item, and attachment item/path must belong to auth.uid().
-- due_reminders only returns a reminder when the item owner matches the reminder owner.

drop policy if exists "insert_own" on public.items;
create policy "insert_own" on public.items
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "update_own" on public.items;
create policy "update_own" on public.items
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "insert_own" on public.reminders;
create policy "insert_own" on public.reminders
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.items i
      where i.id = item_id and i.user_id = auth.uid()
    )
  );

drop policy if exists "update_own" on public.reminders;
create policy "update_own" on public.reminders
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.items i
      where i.id = item_id and i.user_id = auth.uid()
    )
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
  );

drop policy if exists "update_own" on public.attachments;
create policy "update_own" on public.attachments
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and storage_path like (auth.uid()::text || '/%')
    and exists (
      select 1 from public.items i
      where i.id = item_id and i.user_id = auth.uid()
    )
  );

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
  join public.items i on i.id = r.item_id and i.user_id = r.user_id
  join auth.users u on u.id = r.user_id
  where r.sent_at is null
    and i.status = 'active'
    and i.due_date - r.days_before <= current_date
    and i.due_date >= current_date - 30
  order by i.due_date asc;
$$;

revoke all on function public.due_reminders() from public, anon, authenticated;
