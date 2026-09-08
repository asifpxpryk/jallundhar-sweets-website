create table if not exists menu_items (
  id text primary key,
  category_id text,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  is_available boolean default true,
  sort_order int default 0
);

alter table menu_items enable row level security;

drop policy if exists "public can read menu" on menu_items;
create policy "public can read menu"
  on menu_items for select
  to anon, authenticated
  using (true);

insert into menu_items (id, category_id, name, description, price, image_url, is_available, sort_order) values
('5851', 'general', 'Chicken Leg Piece', NULL, 0, '/products/5851.png', true, 0),
('5891', 'snacks', 'Egg Boti Pizza Large', NULL, 420, '/products/5891.png', true, 1),
('5889', 'snacks', 'Cheese Pizza Small', NULL, 340, '/products/5889.png', true, 2),
('5887', 'snacks', 'Cheese Pizza Medium', NULL, 440, '/products/5887.png', true, 3),
('5885', 'snacks', 'Cheese Pizza Large', NULL, 550, '/products/5885.png', true, 4),
('5883', 'snacks', 'Pizza Slice', NULL, 180, '/products/5883.png', true, 5),
('5881', 'snacks', 'Tikka Sandwich', NULL, 180, '/products/5881.png', true, 6),
('5879', 'snacks', 'Boti Sandwich', NULL, 180, '/products/5879.png', true, 7),
('5877', 'snacks', 'Tikka Pastry 1 pc', NULL, 100, '/products/5877.png', true, 8),
('5875', 'snacks', 'Pizza Pastry', NULL, 90, '/products/5875.png', true, 9),
('5873', 'snacks', 'Chicken Croissant', NULL, 70, '/products/5873.png', true, 10),
('5871', 'snacks', 'Cheese Club Sandwich', NULL, 140, '/products/5871.png', true, 11),
('5869', 'snacks', 'Egg Sandwich', NULL, 100, '/products/5869.png', true, 12),
('5866', 'snacks', 'Fried Sandwich', NULL, 100, '/products/5866.png', true, 13),
('5864', 'snacks', 'Two in one Burger Half', NULL, 160, '/products/5864.png', true, 14),
('5862', 'snacks', 'Chicken Boti Burger', NULL, 180, '/products/5862.png', true, 15),
('5860', 'snacks', 'Chicken Chapli 1 Pc', NULL, 80, '/products/5860.png', true, 16),
('5858', 'snacks', 'Chicken Shami Kabab', NULL, 70, '/products/5858.png', true, 17),
('5856', 'snacks', 'Chicken Punch', NULL, 80, '/products/5856.png', true, 18),
('5854', 'snacks', 'Chicken Shashlik Stick 4 boti', NULL, 120, '/products/5854.png', true, 19),
('5852', 'snacks', 'Chicken Leg Piece', NULL, 250, '/products/5852.png', true, 20),
('5849', 'snacks', 'Dhaka Stick', NULL, 140, '/products/5849.png', true, 21),
('5845', 'cafe,fast-food', 'French Fries', NULL, 0, '/products/5845.png', true, 22),
('4743', 'all-products,dairy-essential', 'PACKED YOGURT', NULL, 140, '/products/4743.webp', true, 23),
('4740', 'all-products,dairy-essential', 'Plain Bread', NULL, 100, '/products/4740.webp', true, 24),
('4736', 'all-products,dairy-essential', 'Milky Bread', NULL, 100, '/products/4736.webp', true, 25),
('4732', 'all-products,dairy-essential', 'Brown Bread', NULL, 150, '/products/4732.webp', true, 26),
('4728', 'all-products,dairy-essential', 'Special Desi Ghee (half kg)', NULL, 1250, '/products/4728.webp', true, 27),
('4725', 'all-products,plain-biscuits', 'Mix NIMKO 1 kg', NULL, 1000, '/products/4725.webp', true, 28),
('4719', 'all-products,premium-dollar-cup-cake', 'DOLLER CAKE', NULL, 150, '/products/4719.webp', true, 29),
('4707', 'all-products,premium-sweets,assorted-sweets', 'Chocolate Barfi Rolls', NULL, 1050, '/products/4707.webp', true, 30),
('4703', 'all-products,premium-sweets', 'Chocolate Barfi Plain', NULL, 1150, '/products/4703.webp', true, 31),
('4693', 'all-products,plain-biscuits', 'BASIN PAKORYIA', '200 Grams Pack', 90, '/products/4693.webp', true, 32),
('4686', 'all-products,premium-dry-cake', 'DRY CAKES', NULL, 800, '/products/4686.webp', true, 33),
('4683', 'all-products,premium-rusk', 'LAHORI BUTTER RUSK', NULL, 280, '/products/4683.webp', true, 34),
('4679', 'all-products,premium-rusk', 'BABY RUSK', NULL, 250, '/products/4679.webp', true, 35),
('4677', 'all-products,plain-biscuits,premium-biscuits', 'Special Butter Biscuits', NULL, 850, '/products/4677.webp', true, 36),
('4675', 'all-products,plain-biscuits,premium-biscuits', 'MIX BUTTER BISCUIT', NULL, 1300, '/products/4675.webp', true, 37),
('4668', 'all-products,premium-sweets,assorted-sweets', 'BESAN PAIRAY Desi', NULL, 1000, '/products/4668.webp', true, 38),
('4667', 'all-products,plain-biscuits,premium-biscuits,premium-rusk', 'BAKARKHANI NAMKEEN', NULL, 850, '/products/4667.webp', true, 39),
('4661', 'all-products,premium-sohan-halwa,assorted-sweets', 'AKHROTI SOHAN HALWA', NULL, 1600, '/products/4661.webp', true, 40),
('4655', 'all-products,premium-sweets,assorted-sweets', 'KHOYA CHAM CHAM', NULL, 1050, '/products/4655.webp', true, 41),
('4653', 'all-products,assorted-sweets', 'PHANIYAN 1 KG', NULL, 700, '/products/4653.webp', true, 42),
('4646', 'all-products,assorted-sweets,traditional-sweets', 'CHAM CHAM', NULL, 1050, '/products/4646.webp', true, 43),
('4638', 'all-products,premium-sweets,assorted-sweets', 'KHOYA JAMAN', NULL, 1050, '/products/4638.webp', true, 44),
('4633', 'all-products,premium-sweets,assorted-sweets', 'DESI GHEE BALU SHAHI', NULL, 1050, '/products/4633.webp', true, 45),
('4629', 'all-products,premium-sweets,assorted-sweets', 'Badaam BARFI', NULL, 1150, '/products/4629.webp', true, 46),
('4624', 'all-products,premium-sweets,assorted-sweets', 'EGG MASU Desi Ghee', NULL, 1400, '/products/4624.webp', true, 47),
('4620', 'all-products,premium-sweets,assorted-sweets', 'SPECIAL LAHORI LADU | Moti Choor Laddu', NULL, 850, '/products/4620.webp', true, 48),
('4615', 'all-products,assorted-sweets,traditional-sweets', 'PLAIN BARFI | SADA BARFI', NULL, 575, '/products/4615.webp', true, 49),
('4609', 'all-products,assorted-sweets,traditional-sweets', 'MIX SPECIAL SWEETS', NULL, 500, '/products/4609.webp', true, 50),
('4605', 'all-products,assorted-sweets,traditional-sweets', 'GULAB JAMAN', NULL, 500, '/products/4605.webp', true, 51),
('4599', 'all-products,premium-sohan-halwa,assorted-sweets', 'SOHAN HALWA DESI GHEE', NULL, 800, '/products/4599.webp', true, 52)
on conflict (id) do nothing;
