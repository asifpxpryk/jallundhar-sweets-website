-- Phase 0 of the POS link: each order line knows its product and size, each order has a status.
-- Only adds columns; existing orders keep working (status 'received').

alter table order_items
  add column if not exists product_id text,
  add column if not exists size text,
  add column if not exists unit_qty numeric(10, 3);

alter table orders
  add column if not exists status text not null default 'received',
  add column if not exists status_at timestamptz not null default now(),
  add column if not exists pos_ref text,
  add column if not exists prices_checked boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_status_check') then
    alter table orders
      add constraint orders_status_check
      check (status in ('received', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'));
  end if;
end $$;

create index if not exists order_items_product_id_idx on order_items (product_id);
create index if not exists orders_status_idx on orders (status, created_at desc);
