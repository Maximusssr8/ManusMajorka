-- alerts-migration.sql
-- Creates the `alerts` table backing the Alerts page + /api/cron/check-alerts.
-- RLS: user_id::text = auth.uid()::text (Majorka UUID cast pattern)

create table if not exists public.alerts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null,
  product_id     uuid,
  type           text not null check (type in ('price_drop','score_change','sold_count_spike')),
  threshold      numeric not null default 0,
  frequency      text not null check (frequency in ('instant','daily','weekly')) default 'daily',
  email          text not null,
  category       text,
  last_fired_at  timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists alerts_user_id_idx   on public.alerts (user_id);
create index if not exists alerts_product_id_idx on public.alerts (product_id);
create index if not exists alerts_last_fired_idx on public.alerts (last_fired_at);

alter table public.alerts enable row level security;

drop policy if exists "alerts_select_own" on public.alerts;
create policy "alerts_select_own" on public.alerts
  for select using (user_id::text = auth.uid()::text);

drop policy if exists "alerts_insert_own" on public.alerts;
create policy "alerts_insert_own" on public.alerts
  for insert with check (user_id::text = auth.uid()::text);

drop policy if exists "alerts_update_own" on public.alerts;
create policy "alerts_update_own" on public.alerts
  for update using (user_id::text = auth.uid()::text);

drop policy if exists "alerts_delete_own" on public.alerts;
create policy "alerts_delete_own" on public.alerts
  for delete using (user_id::text = auth.uid()::text);
