-- launch-gate-migration.sql
-- Idempotent catch-up for schema drift detected during 100/100 launch recon:
--  * pipeline_logs missing columns (products_added, products_updated, products_rejected,
--    finished_at, duration_ms, source_breakdown, error_message).
--  * legacy `alerts` table missing (the /api/alerts endpoint's primary store — distinct
--    from `price_alerts` which is the newer price-drop product-watchlist table).
--  * `saved_stores` missing (referenced by server account-delete cascade + stores routes).
-- Safe to re-run.

alter table public.pipeline_logs add column if not exists products_added   integer default 0;
alter table public.pipeline_logs add column if not exists products_updated integer default 0;
alter table public.pipeline_logs add column if not exists products_rejected integer default 0;
alter table public.pipeline_logs add column if not exists finished_at      timestamptz;
alter table public.pipeline_logs add column if not exists duration_ms      integer;
alter table public.pipeline_logs add column if not exists source_breakdown jsonb;
alter table public.pipeline_logs add column if not exists error_message    text;

create table if not exists public.alerts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  product_id      text,
  type            text not null check (type in ('price_drop','score_change','sold_count_spike')),
  threshold       numeric not null,
  frequency       text not null default 'instant' check (frequency in ('instant','daily','weekly')),
  email           text not null,
  category        text,
  last_fired_at   timestamptz,
  created_at      timestamptz default now()
);

create index if not exists idx_alerts_user       on public.alerts (user_id);
create index if not exists idx_alerts_product    on public.alerts (product_id);
alter table public.alerts enable row level security;
drop policy if exists "Users manage own alerts" on public.alerts;
create policy "Users manage own alerts" on public.alerts
  for all using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);

create table if not exists public.saved_stores (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  domain      text,
  metadata    jsonb,
  created_at  timestamptz default now()
);

create index if not exists idx_saved_stores_user on public.saved_stores (user_id);
alter table public.saved_stores enable row level security;
drop policy if exists "Users manage own saved stores" on public.saved_stores;
create policy "Users manage own saved stores" on public.saved_stores
  for all using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);
