-- Sweets rate list (District Sweets & Bakers Association, Rahim Yar Khan), November 2026.
-- Paste into Supabase > SQL Editor and run once. Safe to run again.
-- Prices are per kg unless the item is a piece.

begin;

-- 1) Price updates for items already on the site (rate list number in the comment).
update menu_items set price = 1200 where id = '4609';                               -- 2  Mix Mithai Special (Mix Special Sweets) 1120 -> 1200
update menu_items set price = 1300 where id in ('4707', '4615');                    -- 3  Sada Barfi 1200 -> 1300 (4615 is the hidden duplicate)
update menu_items set price = 1300 where id = 'sweet-khoya-pairy';                  -- 4  Khoya Pairay 1500 -> 1300
update menu_items set price = 1800 where id = '4629';                               -- 5  Barfi Badam 1600 -> 1800
update menu_items set price = 1200 where id = 'sweet-lacha-rabri';                  -- 7  Amrati 1120 -> 1200
update menu_items set price = 1000 where id = 'sweets-balu-shahi-shakar-pare';      -- 8  Balushahi 850 -> 1000
update menu_items set price = 1200 where id = 'sweets-lahori-laddu-gari-badam';     -- 9  Lahori Laddu Gari Badam 1600 -> 1200
update menu_items set price = 1000 where id = '4620';                               -- 10 Moti Choor Laddu 850 -> 1000
update menu_items set price = 1800 where id in ('4599', 'item-1788948278774');      -- 11 Sohan Halwa Desi Ghee 1600 -> 1800 (second id is the hidden duplicate)
update menu_items set price = 170  where id = 'sweets-ras-malai-1-piece';           -- 12 Ras Malai per piece 150 -> 170
update menu_items set price = 340  where id = 'sweets-ras-malai-2-piece';           -- 12 Ras Malai 2 piece 300 -> 340
update menu_items set price = 1200 where id = '4605';                               -- 13 Gulab Jamun 1120 -> 1200
update menu_items set price = 1200 where id = '4646';                               -- 14 Cham Cham 1120 -> 1200
update menu_items set price = 1200 where id = 'sweets-bengali';                     -- 15 Bengali Cham Cham 1120 -> 1200
update menu_items set price = 1420 where id = 'sweet-khoya-kalaqand';               -- 17 Khoya Qalaqand 1300 -> 1420
update menu_items set price = 1780 where id in (
  'sweets-badam-khajoor-pista-kaju-pak',                                            -- 18 Badam Pak 1200 -> 1780
  'sweet-badam-pak', 'sweet-badam-khjoor-pak',                                      -- 18 hidden Badam / Khajoor Pak rows
  'sweet-dodh-mesu'                                                                 -- 18 Doodh Mesu Desi Ghee 1700 -> 1780
);
update menu_items set price = 2100 where id in ('4661', 'sweets-kaju-sohan-halwa'); -- 19 Akhroti / Kaju Sohan Halwa 1700 / 2200 -> 2100
update menu_items set price = 1700 where id = '4624';                               -- 21 Desi Ghee Anda Mesu 1400 -> 1700
update menu_items set price = 1700 where id = '4668';                               -- 22 Desi Ghee Besan Pairay 1120 -> 1700
update menu_items set price = 1700 where id = '4633';                               -- 23 Desi Ghee Balushahi 1600 -> 1700
update menu_items set price = 2400 where id = 'sweets-special-zaitoon-sohan-halwa'; -- 26 Special Zaitoon Sohan Halwa 2200 -> 2400
update menu_items set price = 880  where id = '4653';                               -- 27 Phainiyan 720 -> 880
update menu_items set price = 750  where id = 'sweets-kheer';                       -- 28 Kheer 640 -> 750
update menu_items set price = 1100 where id = '4725';                               -- 29 Nimko 1000 -> 1100
update menu_items set price = 1600 where id in (
  'item-1788974716263',                                                             -- 34 Sugar Free Barfi 1200 -> 1600
  'item-1788974744955'                                                              -- 34 Sugar Free Gulab Jamun 1300 -> 1600
);
-- Already correct, no change: 6 Pateesa 1200, 16 Gajar Halwa 1300, 35 Sugar Free Sohan Halwa 1600.

-- 2) Items on the rate list that the site did not have.
insert into menu_items (id, category_id, name, description, price, image_url, is_available, is_hidden, sort_order) values
('sweets-mix-mithai', 'sweets', E'Mix Mithai /kg\nمکس مٹھائی', 'Besan, petha, laddu, barfi, pateesa, gulab jamun, cham cham, balushahi', 1200,
  'https://gyahtewnpgzswfumljoa.supabase.co/storage/v1/object/public/product-photos/1788982822712-7d28f5d1-2a94-41e7-a5a4-1f31084d43f5.jpg', true, false, 945),  -- 1
('sweets-desi-ghee-pateesa', 'sweets', E'Desi Ghee Pateesa /kg\nدیسی گھی پتیسہ', null, 1700,
  'https://gyahtewnpgzswfumljoa.supabase.co/storage/v1/object/public/product-photos/1788982660407-a0e7767c-9b4d-432a-a348-77a608d7e10c.jpg', true, false, 946),  -- 20
('sweets-desi-ghee-moti-choor-laddu', 'sweets', E'Desi Ghee Moti Choor Laddu /kg\nدیسی گھی موتی چور لڈو', null, 1700,
  'https://gyahtewnpgzswfumljoa.supabase.co/storage/v1/object/public/product-photos/1788983177664-b09e0b1b-7c23-4ddc-8ea6-9be1abf13d94.jpg', true, false, 947),  -- 24
('sweets-sugar-free-balushahi', 'sweets', E'Sugar Free Balushahi /kg\nشوگر فری بالوشاہی', null, 1600,
  'https://gyahtewnpgzswfumljoa.supabase.co/storage/v1/object/public/product-photos/1790879198731-612a0b1f-80fa-4719-b790-6225fe7f8ef7.jpg', true, false, 948),  -- 36
('sweets-sugar-free-pateesa', 'sweets', E'Sugar Free Pateesa /kg\nشوگر فری پتیسہ', null, 1600,
  'https://gyahtewnpgzswfumljoa.supabase.co/storage/v1/object/public/product-photos/1788982660407-a0e7767c-9b4d-432a-a348-77a608d7e10c.jpg', true, false, 949),  -- 36
('snacks-aloo-samosa', 'snacks', E'Aloo Samosa 1 Pc\nآلو سموسہ', null, 30, null, true, false, 950),                                                                   -- 30
('snacks-manda-roll', 'snacks', E'Manda Roll 1 Pc\nمانڈا رول', null, 50, null, true, false, 951),                                                                      -- 31
('snacks-chicken-samosa-raita', 'snacks', E'Chicken Samosa + Raita 1 Pc\nچکن سموسہ + رائتہ', null, 50, null, true, false, 952),                                      -- 32
('snacks-manda-samosa', 'snacks', E'Manda Samosa 1 Pc\nمانڈا سموسہ', null, 35, null, true, false, 953)                                                                 -- 33
on conflict (id) do nothing;

commit;

-- 3) Check: every row this script touched, with its new price.
select id, replace(name, E'\n', ' | ') as name, price, category_id
from menu_items
where id in (
  '4609','4707','4615','sweet-khoya-pairy','4629','sweet-lacha-rabri','sweets-balu-shahi-shakar-pare',
  'sweets-lahori-laddu-gari-badam','4620','4599','item-1788948278774','sweets-ras-malai-1-piece',
  'sweets-ras-malai-2-piece','4605','4646','sweets-bengali','sweet-khoya-kalaqand',
  'sweets-badam-khajoor-pista-kaju-pak','sweet-badam-pak','sweet-badam-khjoor-pak','sweet-dodh-mesu',
  '4661','sweets-kaju-sohan-halwa','4624','4668','4633','sweets-special-zaitoon-sohan-halwa','4653',
  'sweets-kheer','4725','item-1788974716263','item-1788974744955',
  'sweets-mix-mithai','sweets-desi-ghee-pateesa','sweets-desi-ghee-moti-choor-laddu',
  'sweets-sugar-free-balushahi','sweets-sugar-free-pateesa',
  'snacks-aloo-samosa','snacks-manda-roll','snacks-chicken-samosa-raita','snacks-manda-samosa'
)
order by id;
