import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const CATEGORY_ID = "340";
const AISLE_KEY = "beverage:soft-drinks";
const FILE_PREFIX = "soft-drinks";

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function fileSafe(handle) {
  return handle.replace(/[^a-z0-9-]/g, "");
}

function extFromUrl(url) {
  const path = url.split("?")[0].toLowerCase();
  if (path.endsWith(".webp")) return "webp";
  if (path.endsWith(".png")) return "png";
  if (path.endsWith(".gif")) return "gif";
  return "jpg";
}

async function fetchPage(page) {
  const query = `{
    products(filter: { category_id: { eq: "${CATEGORY_ID}" } }, pageSize: 50, currentPage: ${page}) {
      total_count
      items {
        sku
        name
        url_key
        small_image { url }
        price_range { minimum_price { final_price { value } } }
      }
    }
  }`;
  const res = await fetch("https://www.naheed.pk/graphql", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`graphql ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(JSON.stringify(data.errors));
  return data.data.products;
}

async function fetchAll() {
  const first = await fetchPage(1);
  const products = [...(first.items ?? [])];
  const total = first.total_count ?? products.length;
  const pages = Math.ceil(total / 50);
  console.log("total", total);
  for (let page = 2; page <= pages; page++) {
    const batch = await fetchPage(page);
    products.push(...(batch.items ?? []));
    console.log("page", page, "loaded", products.length, "/", total);
  }
  return products;
}

const products = await fetchAll();
const dir = join("public", "products", FILE_PREFIX);
mkdirSync(dir, { recursive: true });

const seen = new Set();
const items = [];
let order = 0;

for (const product of products) {
  const handle = slugify(product.url_key || product.sku || product.name);
  if (!handle || seen.has(handle)) continue;
  const src = product.small_image?.url;
  const price = Math.round(Number(product.price_range?.minimum_price?.final_price?.value));
  if (!src || !Number.isFinite(price) || price <= 0) {
    console.log("skip", handle);
    continue;
  }
  seen.add(handle);
  const ext = extFromUrl(src);
  const file = `${fileSafe(handle)}.${ext}`;
  const dest = join(dir, file);
  const res = await fetch(src, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!res.ok) {
    console.log("image fail", handle, res.status);
    continue;
  }
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  items.push({
    id: `${FILE_PREFIX}-${handle}`,
    category_id: "beverage",
    name: String(product.name).trim(),
    description: null,
    price,
    image_url: `/products/${FILE_PREFIX}/${file}`,
    is_available: true,
    sort_order: order++,
  });
}

const catalogPath = join("data", "aisle-items.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
catalog[AISLE_KEY] = items;
writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
console.log("saved", items.length);
