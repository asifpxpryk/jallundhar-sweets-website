-- Every sweet still at Rs 1120 per kg moves to Rs 1200 (November 2026 rate list).
-- Paste into Supabase > SQL Editor and run once. Only rows in the sweets section are touched.
-- 15 rows as of 2026-11-16: Khoya Cham Cham, Khoya Jaman, Asghar Shahi, Dorangi, Falsa Sweets,
-- Milky Pateesa, Paitha, Chocolate Pateesa, Karachi Halwa, Shahi Tukra (x2), Rasgulle,
-- Do Rangi, Anda Mesu, Sada Mesu (hidden rows included so they are right if shown again).

update menu_items
set price = 1200
where category_id = 'sweets'
  and price = 1120
returning id, replace(name, E'\n', ' | ') as name, price;
