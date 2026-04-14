-- Majorka: saved_stores + saved_ad_sets tables with RLS
-- Run via: psql or Supabase SQL editor. Idempotent.

create extension if not exists "pgcrypto";

-- ── saved_stores ────────────────────────────────────────────────
create table if not exists public.saved_stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  niche text,
  market text,
  tagline text,
  palette jsonb,
  fonts jsonb,
  products jsonb,
  concept jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_stores_user_id_idx on public.saved_stores (user_id);
create index if not exists saved_stores_created_at_idx on public.saved_stores (created_at desc);

alter table public.saved_stores enable row level security;

drop policy if exists "saved_stores_select_own" on public.saved_stores;
create policy "saved_stores_select_own" on public.saved_stores
  for select using (auth.uid()::text = user_id::text);

drop policy if exists "saved_stores_insert_own" on public.saved_stores;
create policy "saved_stores_insert_own" on public.saved_stores
  for insert with check (auth.uid()::text = user_id::text);

drop policy if exists "saved_stores_update_own" on public.saved_stores;
create policy "saved_stores_update_own" on public.saved_stores
  for update using (auth.uid()::text = user_id::text);

drop policy if exists "saved_stores_delete_own" on public.saved_stores;
create policy "saved_stores_delete_own" on public.saved_stores
  for delete using (auth.uid()::text = user_id::text);

-- ── saved_ad_sets ───────────────────────────────────────────────
create table if not exists public.saved_ad_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_title text not null,
  product_image text,
  product_url text,
  platform text,
  format text,
  headlines jsonb,
  bodies jsonb,
  ctas jsonb,
  hook text,
  audience text,
  interests jsonb,
  created_at timestamptz not null default now()
);

create index if not exists saved_ad_sets_user_id_idx on public.saved_ad_sets (user_id);
create index if not exists saved_ad_sets_created_at_idx on public.saved_ad_sets (created_at desc);

alter table public.saved_ad_sets enable row level security;

drop policy if exists "saved_ad_sets_select_own" on public.saved_ad_sets;
create policy "saved_ad_sets_select_own" on public.saved_ad_sets
  for select using (auth.uid()::text = user_id::text);

drop policy if exists "saved_ad_sets_insert_own" on public.saved_ad_sets;
create policy "saved_ad_sets_insert_own" on public.saved_ad_sets
  for insert with check (auth.uid()::text = user_id::text);

drop policy if exists "saved_ad_sets_delete_own" on public.saved_ad_sets;
create policy "saved_ad_sets_delete_own" on public.saved_ad_sets
  for delete using (auth.uid()::text = user_id::text);
