import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const products = [
  ["national-iodized-salt-800g", "National Iodized Salt 800g", 70, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/grocerapp-national-iodized-salt-5ea2893524d20_800x800.jpg?v=1784264251"],
  ["national-fried-chops-masala-national", "National Fried Chops Masala", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/images_51_800x800.jpg?v=1781084946"],
  ["national-foods-tomato-ketchup-800gm", "National Foods Tomato Ketchup 800gm", 420, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/620514005836_5a9b9aaa-8b99-48aa-9b18-8ae91cb7d852_1_800x800.webp?v=1784262601"],
  ["national-foods-tomato-ketchup-400gm", "National Foods Tomato Ketchup 400gm", 240, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/620514005836_5a9b9aaa-8b99-48aa-9b18-8ae91cb7d852_800x800.webp?v=1784262319"],
  ["qeema-masala-national", "Qeema Masala National", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/ddbcf7f0363c72b706b6491b90a40fb9_800x800.webp?v=1781084660"],
  ["paya-masala-national", "Paya Masala National", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/NewProject-2023-10-28T121510.952_800x800.webp?v=1781084769"],
  ["national-chat-masala", "National Chat Masala", 120, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000009146_8f7327ea-e786-4921-86ad-1b6267523566_800x800.webp?v=1781189645"],
  ["national-ch-tikka", "National Chicken Tikka", 130, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/620514021201_800x800.webp?v=1781191184"],
  ["national-masala-biryani", "National Masala Biryani", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/NewProject-2023-10-28T114415.909_800x800.webp?v=1781263602"],
  ["national-masala-quorma", "National Masala Quorma", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/NewProject-2023-10-28T130820.323_800x800.webp?v=1781083650"],
  ["national-soy-sauce-300ml", "National Soy Sauce 300ml", 200, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/1160673-1_800x800.jpg?v=1783488679"],
  ["national-garam-masala-powder", "National Garam Masala Powder", 165, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000170429_800x800.webp?v=1781021771"],
  ["national-black-pepper-powder-25-gm", "National Black Pepper Powder", 165, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000391906_800x800.webp?v=1781022244"],
  ["national-masala-haleem-mix", "National Masala Haleem Mix", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000114506_bbe3296c-460d-4021-957f-cab50335a015_800x800.webp?v=1781084327"],
  ["kofta-recipe-mix-national", "Kofta Recipe Mix National", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/images_50_800x800.jpg?v=1781084536"],
  ["national-masala-shami-kabab", "National Masala Shami Kabab", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000114549_800x800.webp?v=1781189159"],
  ["national-achar-gosht-masala", "National Achar Gosht Masala", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/8_79b97ba0-8440-4cae-8fba-8035ba7bc86f_800x800.webp?v=1781189933"],
  ["national-masala-chicken-jalferezi", "National Masala Chicken Jalferezi", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000114522_800x800.webp?v=1781190668"],
  ["national-masala-tikka-boti", "National Masala Tikka Boti", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000114563_5d4f73c3-5f16-4a85-8619-b895f54808e7_800x800.webp?v=1781191741"],
  ["national-pulao-masala-mix", "National Pulao Masala Mix", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000114548_2350bb44-875d-4fc8-bc86-0e29ffe163fa_800x800.webp?v=1781262954"],
  ["national-red-chilli-powder-400g", "National Red Chilli Powder", 105, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/12622193-0-M_800x800.webp?v=1781265406"],
  ["national-white-vinegar-300-ml", "National White Vinegar 300 ml", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/national-white-vinegar-300-ml-904579_800x800.webp?v=1783485528"],
  ["national-foods-ginger-powder-50g", "National Foods Ginger Powder 50g", 250, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/620514000046_800x800.webp?v=1781022139"],
  ["national-kasuri-methi-25-gm", "National Kasuri Methi 25 gm", 80, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000114504_800x800.webp?v=1781022425"],
  ["national-powder-coriander-200-gm", "National Powder Coriander 200 gm", 350, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/620514000879_2_800x800.webp?v=1781022575"],
  ["national-foods-curry-powder-250g", "National Foods Curry Powder 250g", 390, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/620514017471_800x800.webp?v=1781085197"],
  ["national-masala-karahi-gosht-mix", "National Masala Karahi Gosht Mix", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000114555_2c51f9a4-14e9-487b-b374-ee3139c8b335_800x800.webp?v=1781190251"],
  ["national-seekh-kabab-recipe-mix", "National Seekh Kabab Recipe Mix", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/download_2_800x800.jpg?v=1781191408"],
  ["national-masala-sindhi-biryani-mix", "National Masala Sindhi Biryani Mix", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000114524_9b919aef-6b3b-4da5-a5d0-bece42ffdf00_800x800.webp?v=1781264255"],
  ["national-masala-pulao-biryani-single", "National Masala Pulao Biryani Single", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/1304978-1_800x800.webp?v=1781264461"],
  ["national-drizzl-american-bbq-sauce-315g", "National Drizzl American BBQ Sauce 315g", 400, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/1288087-1_800x800.jpg?v=1783520801"],
  ["national-masala-garlic-powder-50-gm", "National Masala Garlic Powder 50 gm", 140, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000114557_8a40efcd-a975-44b7-b6ba-5bd49a6a6f79_800x800.webp?v=1781022721"],
  ["national-white-qourma-masala-40-gm", "National White Qourma Masala 40 gm", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/620514020860_800x800.webp?v=1781083948"],
  ["national-masala-haleem-mix-43-gm", "National Masala Haleem Mix 43 gm", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000114506_bbe3296c-460d-4021-957f-cab50335a015_1_800x800.webp?v=1781189400"],
  ["national-danedar-haleem-poff-293-gm", "National Danedar Haleem Poff 293 gm", 250, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/620514021362_800x800.webp?v=1781264762"],
  ["national-haleem-mix-quick-cook-338gm", "National Haleem Mix Quick Cook 338gm", 250, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000114523_e0dd27a6-36bf-4ae6-be19-86e2ff54b229_800x800.webp?v=1781264848"],
  ["national-masala-bombay-biryani-karachi-khas", "National Masala Bombay Biryani Karachi Khas", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000316519_800x800.webp?v=1781262671"],
  ["national-food-chinese-chilli-sauce-300ml-bottle", "National Food Chinese Chilli Sauce 300ml", 200, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/620514001814_800x800.webp?v=1783485414"],
  ["national-drizzl-peri-peri-sauce-280-gr", "National Drizz'l Peri Peri Sauce 280g", 480, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/296257_main_800x800.avif?v=1783521276"],
  ["national-drizzl-thai-sweet-chilli-sauce-325g", "National Drizz'l Thai Sweet Chilli Sauce 325g", 380, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/620514020266_grande_88b6db7b-04d6-4242-a8c4-da23b781db58_800x800.webp?v=1783523354"],
  ["national-drizzl-american-hot-sauce-290-gr", "National Drizz'l American Hot Sauce 290g", 400, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/296256_main_800x800.jpg?v=1783523440"],
  ["national-powder-cumin-seed-ground-50-gm", "National Powder Cumin Seed Ground 50 gm", 350, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000009145_800x800.webp?v=1781022196"],
  ["national-masala-chapli-kabab-mix-72-gm", "National Masala Chapli Kabab Mix 72 gm", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000114532_eae84c73-f6ba-4d8c-bf5a-d5ed2ff9d7cc_800x800.webp?v=1781184815"],
  ["national-karachi-khaas-nihari-recipe-mix-112-gm", "National Karachi Khaas Nihari Recipe Mix 112 gm", 150, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/AFP-000487017_800x800.webp?v=1781024133"],
  ["national-foods-drizzl-thai-sriracha-sauce-hot-tangy-400g", "National Foods Drizz'l Thai Sriracha Sauce 400g", 450, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/c41a4387-a8e7-494d-814b-b0dbe774248e_800x800.webp?v=1783517191"],
  ["national-foods-drizzl-american-hot-sauce-hot-spicy-290g", "National Foods Drizz'l American Hot Sauce 290g", 400, "https://cdn.shopify.com/s/files/1/0750/5933/1328/files/eaa191bf-a5fb-42ee-bc04-3661e2c8d2cf_800x800.webp?v=1783519671"],
];

const dir = join("public", "products", "cooking");
mkdirSync(dir, { recursive: true });

const items = [];
let order = 0;
for (const [handle, name, price, url] of products) {
  const ext = url.includes(".webp") ? "webp" : url.includes(".avif") ? "avif" : "jpg";
  const file = `${handle}.${ext}`;
  const dest = join(dir, file);
  const res = await fetch(url);
  if (!res.ok) {
    console.log("fail", handle, res.status);
    continue;
  }
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  items.push({
    id: `cooking-${handle}`,
    category_id: "general",
    name,
    description: null,
    price,
    image_url: `/products/cooking/${file}`,
    is_available: true,
    sort_order: order++,
  });
}

writeFileSync(
  join("data", "aisle-items.json"),
  JSON.stringify({ cooking: items }, null, 2) + "\n"
);
console.log("saved", items.length);
