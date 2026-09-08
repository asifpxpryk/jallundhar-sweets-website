import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const COLLECTIONS = ["lux", "dove", "ponds", "nivea"];
const aisle = "personal-care";

function extFromUrl(url) {
  const path = url.split("?")[0].toLowerCase();
  if (path.endsWith(".webp")) return "webp";
  if (path.endsWith(".avif")) return "avif";
  if (path.endsWith(".png")) return "png";
  if (path.endsWith(".gif")) return "gif";
  return "jpg";
}

async function fetchCollection(slug, page) {
  const url = `https://cocosonline.co/collections/${slug}/products.json?limit=250&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  const data = await res.json();
  return data.products ?? [];
}

async function fetchAll(slug) {
  const products = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await fetchCollection(slug, page);
    if (batch.length === 0) break;
    products.push(...batch);
    if (batch.length < 250) break;
  }
  return products;
}

const seen = new Set();
const products = [];
for (const slug of COLLECTIONS) {
  const batch = await fetchAll(slug);
  let added = 0;
  for (const product of batch) {
    if (seen.has(product.handle)) continue;
    seen.add(product.handle);
    products.push(product);
    added++;
  }
  console.log(slug, batch.length, "unique-added", added);
}

const dir = join("public", "products", aisle);
mkdirSync(dir, { recursive: true });

const items = [];
let order = 0;
for (const product of products) {
  const src = product.images?.[0]?.src;
  if (!src) {
    console.log("no image", product.handle);
    continue;
  }
  const ext = extFromUrl(src);
  const file = `${product.handle}.${ext}`;
  const dest = join(dir, file);
  const res = await fetch(src);
  if (!res.ok) {
    console.log("fail", product.handle, res.status);
    continue;
  }
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  const price = Math.round(Number(product.variants?.[0]?.price ?? 0));
  items.push({
    id: `${aisle}-${product.handle}`,
    category_id: "general",
    name: String(product.title).trim(),
    description: null,
    price,
    image_url: `/products/${aisle}/${file}`,
    is_available: true,
    sort_order: order++,
  });
}

const catalogPath = join("data", "aisle-items.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
catalog[aisle] = items;
writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
console.log("saved", items.length);
