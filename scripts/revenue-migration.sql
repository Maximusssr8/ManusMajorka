-- revenue-migration.sql
-- Creates the `revenue_entries` table backing the Revenue Diary page.
-- Manual daily entries — ad_spend, orders, note — keyed by user + date.
-- RLS: user_id::text = auth.uid()::text (Majorka UUID cast pattern)

create table if not exists public.revenue_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  date          date not null,
  revenue_aud   numeric not null default 0,
  ad_spend_aud  numeric not null default 0,
  orders        int not null default 0,
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists revenue_entries_user_id_idx    on public.revenue_entries (user_id);
create index if not exists revenue_entries_user_date_idx  on public.revenue_entries (user_id, date desc);

alter table public.revenue_entries enable row level security;

drop policy if exists "revenue_entries_select_own" on public.revenue_entries;
create policy "revenue_entries_select_own" on public.revenue_entries
  for select using (user_id::text = auth.uid()::text);

drop policy if exists "revenue_entries_insert_own" on public.revenue_entries;
create policy "revenue_entries_insert_own" on public.revenue_entries
  for insert with check (user_id::text = auth.uid()::text);

drop policy if exists "revenue_entries_update_own" on public.revenue_entries;
create policy "revenue_entries_update_own" on public.revenue_entries
  for update using (user_id::text = auth.uid()::text);

drop policy if exists "revenue_entries_delete_own" on public.revenue_entries;
create policy "revenue_entries_delete_own" on public.revenue_entries
  for delete using (user_id::text = auth.uid()::text);
