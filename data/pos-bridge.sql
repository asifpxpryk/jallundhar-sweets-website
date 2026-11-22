-- POS bridge, website side (phases 3, 4 and 6). NOT applied by the site: run it once in the
-- Supabase SQL editor of the website project. Safe to run again (every step is "if not exists").
--
-- The site already ships code that reads these columns defensively, so it works before and after.
--
-- menu_items, written by the POS cloud function "web-bridge" with the website service key:
--   pos_linked      true for rows whose price, stock and hide come from the shop POS
--                   (website admin can't change those three on such rows)
--   pos_product_id  the shop product id (text)
--   deal_price      shop deal price; used while deal_ends_at is null or in the future
--   deal_label      label shown with the deal (e.g. "Eid offer")
--   deal_ends_at    when the deal stops; after it the normal price applies again
--   pos_synced_at   when the POS last wrote the row
--
-- orders: order_number is looked up by /order/<number> tracking, and the POS reads orders
-- that have no pos_ref yet.

alter table menu_items
  add column if not exists pos_linked boolean not null default false,
  add column if not exists pos_product_id text,
  add column if not exists deal_price numeric,
  add column if not exists deal_label text,
  add column if not exists deal_ends_at timestamptz,
  add column if not exists pos_synced_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'menu_items_deal_price_check') then
    alter table menu_items
      add constraint menu_items_deal_price_check check (deal_price is null or deal_price >= 0);
  end if;
end $$;

create index if not exists menu_items_pos_product_id_idx
  on menu_items (pos_product_id) where pos_product_id is not null;
create index if not exists orders_order_number_idx on orders (order_number);
create index if not exists orders_pos_pending_idx on orders (created_at) where pos_ref is null;
