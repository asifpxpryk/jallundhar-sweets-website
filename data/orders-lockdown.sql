-- Run this in the Supabase SQL editor ONLY AFTER the new website version is live
-- and SUPABASE_SECRET_KEY is set in the hosting environment.
--
-- The new site saves orders through /api/order (rate limited) with the secret key,
-- so the public key no longer needs to write orders. Removing these two policies stops
-- bots from pushing fake orders straight into the database with the public key.
--
-- Do NOT run it while the old site version is live: the old version writes orders
-- with the public key and would stop saving them.

drop policy if exists "public can insert orders" on orders;
drop policy if exists "public can insert order items" on order_items;
