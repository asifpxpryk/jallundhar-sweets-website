-- Run in new Supabase SQL editor so admin can see every order.

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number serial,
  customer_name text,
  phone text not null,
  address text,
  location text,
  payment_method text,
  notes text,
  subtotal numeric,
  total numeric,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders (id) on delete cascade,
  item_name text not null,
  quantity int not null,
  unit_price numeric,
  line_total numeric
);

alter table orders enable row level security;
alter table order_items enable row level security;

drop policy if exists "public can insert orders" on orders;
create policy "public can insert orders"
  on orders for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public can insert order items" on order_items;
create policy "public can insert order items"
  on order_items for insert
  to anon, authenticated
  with check (true);
