-- product-lists-migration.sql
-- Named product collections ("lists") with items. Backs /app/lists and the
-- heart+list-picker on product cards (Engagement Director).
-- RLS: user_id::text = auth.uid()::text on product_lists; items inherit via list_id.

create table if not exists public.product_lists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  emoji       text default '📦',
  created_at  timestamptz default now()
);

create index if not exists product_lists_user_id_idx on public.product_lists (user_id);

create table if not exists public.product_list_items (
  id            uuid primary key default gen_random_uuid(),
  list_id       uuid not null references public.product_lists(id) on delete cascade,
  product_id    text not null,
  product_data  jsonb not null,
  saved_at      timestamptz default now(),
  unique(list_id, product_id)
);

create index if not exists product_list_items_list_id_idx on public.product_list_items (list_id);

alter table public.product_lists enable row level security;
alter table public.product_list_items enable row level security;

drop policy if exists "Users manage own lists" on public.product_lists;
create policy "Users manage own lists" on public.product_lists
  for all using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);

drop policy if exists "Users manage own list items" on public.product_list_items;
create policy "Users manage own list items" on public.product_list_items
  for all using (
    list_id in (select id from public.product_lists where user_id::text = auth.uid()::text)
  )
  with check (
    list_id in (select id from public.product_lists where user_id::text = auth.uid()::text)
  );
