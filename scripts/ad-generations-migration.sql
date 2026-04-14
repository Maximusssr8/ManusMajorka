-- ad-generations-migration.sql
-- Creates the `ad_generations` table backing the Ads Studio history drawer.
-- Each row is one Claude Haiku ad-copy generation tied to a user + product.
-- RLS: user_id::text = auth.uid()::text (Majorka UUID cast pattern).

create table if not exists public.ad_generations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  product_id  text not null,
  format      text not null check (format in ('meta_feed', 'meta_story', 'tiktok_feed', 'tiktok_story')),
  market      text not null default 'AU',
  output_json jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists ad_generations_user_id_idx    on public.ad_generations (user_id);
create index if not exists ad_generations_product_id_idx on public.ad_generations (product_id);
create index if not exists ad_generations_created_at_idx on public.ad_generations (created_at desc);

alter table public.ad_generations enable row level security;

drop policy if exists "ad_generations_select_own" on public.ad_generations;
create policy "ad_generations_select_own" on public.ad_generations
  for select using (user_id::text = auth.uid()::text);

drop policy if exists "ad_generations_insert_own" on public.ad_generations;
create policy "ad_generations_insert_own" on public.ad_generations
  for insert with check (user_id::text = auth.uid()::text);

drop policy if exists "ad_generations_delete_own" on public.ad_generations;
create policy "ad_generations_delete_own" on public.ad_generations
  for delete using (user_id::text = auth.uid()::text);
