-- product-views-migration.sql
-- Records each time a user views a product. Powers the "Since you last logged in"
-- dashboard deltas (most-viewed jump) and future personalisation.
-- Also stamps last_login_at on user_preferences for the deltas query.

create table if not exists public.product_views (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  product_id uuid not null,
  viewed_at  timestamptz not null default now()
);

create index if not exists product_views_user_idx    on public.product_views (user_id);
create index if not exists product_views_product_idx on public.product_views (product_id);
create index if not exists product_views_viewed_idx  on public.product_views (viewed_at);

alter table public.product_views enable row level security;

drop policy if exists "product_views_select_own" on public.product_views;
create policy "product_views_select_own" on public.product_views
  for select using (user_id::text = auth.uid()::text);

drop policy if exists "product_views_insert_own" on public.product_views;
create policy "product_views_insert_own" on public.product_views
  for insert with check (user_id::text = auth.uid()::text);

-- last_login_at on user_preferences (already exists) — nullable, stamped by /api/user/ping.
alter table if exists public.user_preferences
  add column if not exists last_login_at timestamptz;

alter table if exists public.user_preferences
  add column if not exists tracked_categories text[] default '{}';
