/**
 * One-off: pull live WooCommerce menu + images into this repo.
 * Run: node scripts/export-woo-menu.mjs
 */
import { mkdir, writeFile } from "fs/promises";
import { extname } from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const HIDDEN = [
  "special pizza",
  "cheesy creamy pizza",
  "cheese lover pizza",
  "supreme pizza",
  "malai botti pizza",
  "malai boti pizza",
  "fajita pizza",
  "tikka pizza",
  "green chilli pizza",
  "loaded fries small",
];

function normalizeName(value) {
  return value
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isHidden(name) {
  const n = normalizeName(name);
  return HIDDEN.some((key) => n === key || n.startsWith(`${key} `));
}

function stripHtml(html) {
  if (!html) return null;
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text || null;
}

function extFromUrl(url) {
  try {
    const clean = new URL(url).pathname;
    const ext = extname(clean).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) return ext;
  } catch {
    /* ignore */
  }
  return ".jpg";
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok || !res.body) return false;
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  return true;
}

const products = [];
for (let page = 1; page <= 10; page++) {
  const res = await fetch(
    `https://jallundharmain.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`
  );
  if (!res.ok) break;
  const batch = await res.json();
  if (!Array.isArray(batch) || batch.length === 0) break;
  products.push(...batch);
  if (batch.length < 100) break;
}

await mkdir("public/products", { recursive: true });
await mkdir("data", { recursive: true });

const items = [];
let i = 0;
for (const p of products) {
  if (isHidden(p.name)) continue;
  const minor = p.prices?.currency_minor_unit ?? 2;
  const raw = Number(p.prices?.price || 0);
  const price = minor > 0 ? raw / 10 ** minor : raw;
  const remote = p.images?.[0]?.src || null;
  let image_url = null;
  if (remote) {
    const ext = extFromUrl(remote);
    const filename = `${p.id}${ext}`;
    const dest = `public/products/${filename}`;
    try {
      const ok = await download(remote, dest);
      if (ok) image_url = `/products/${filename}`;
    } catch {
      image_url = remote;
    }
  }

  items.push({
    id: String(p.id),
    category_id: (p.categories || []).map((c) => c.slug).join(",") || "general",
    woo_category_slugs: (p.categories || []).map((c) => c.slug),
    name: p.name,
    description: stripHtml(p.short_description) || stripHtml(p.description),
    price,
    image_url,
    remote_image_url: remote,
    is_available: p.is_in_stock !== false,
    sort_order: i++,
  });
}

await writeFile("data/menu-items.json", JSON.stringify(items, null, 2), "utf8");

const sqlRows = items
  .map((item) => {
    const name = item.name.replace(/'/g, "''");
    const desc = item.description ? `'${item.description.replace(/'/g, "''")}'` : "NULL";
    const img = item.image_url ? `'${item.image_url.replace(/'/g, "''")}'` : "NULL";
    return `('${item.id}', '${item.category_id.replace(/'/g, "''")}', '${name}', ${desc}, ${item.price}, ${img}, ${item.is_available}, ${item.sort_order})`;
  })
  .join(",\n");

const sql = `-- Import into new Supabase when ready.
-- create table menu_items (
--   id text primary key,
--   category_id text,
--   name text not null,
--   description text,
--   price numeric not null,
--   image_url text,
--   is_available boolean default true,
--   sort_order int default 0
-- );

insert into menu_items (id, category_id, name, description, price, image_url, is_available, sort_order) values
${sqlRows};
`;

await writeFile("data/menu-items.sql", sql, "utf8");
console.log(`Saved ${items.length} items (from ${products.length} Woo products)`);
