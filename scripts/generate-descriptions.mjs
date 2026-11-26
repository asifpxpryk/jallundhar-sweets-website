// Writes a plain 2–3 sentence description for every product that has none.
// Usage: node scripts/generate-descriptions.mjs <catalog-dump.json | descriptions-review.csv>
// The dump is { rows: [{ id, name, display, section, aisle, description }] } (from the dev-only slug dump route).
// Output: data/product-descriptions.json (used by the site) and descriptions-review.csv (for review).
// Uses the name and where it is sold, in the shop's own warm wording ("finest", "premium", "best taste").
// No ingredient or health claims (desi ghee, sugar-free) and no size line.
import fs from "node:fs";
import path from "node:path";

const [, , dumpPath] = process.argv;
if (!dumpPath) {
  console.error("usage: node scripts/generate-descriptions.mjs <catalog-dump.json>");
  process.exit(1);
}
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
function parseCsv(text) {
  const lines = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell.replace(/\r$/, "")); lines.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); lines.push(row); }
  const [head, ...body] = lines.filter((line) => line.length > 1);
  const col = (key) => head.indexOf(key);
  return body.map((line) => ({ id: line[col("id")], section: line[col("section")], aisle: line[col("aisle")] || null, name: line[col("name")], display: line[col("name")] }));
}
// Input: the catalogue dump (JSON) or, to reword what is already there, descriptions-review.csv.
const raw = fs.readFileSync(dumpPath, "utf8").replace(/^\uFEFF/, "");
const rows = dumpPath.endsWith(".csv") ? parseCsv(raw) : JSON.parse(raw).rows;

const SHOP = "Jallundhar Sweets & Bakers";
const PLACE = "Shahi Road, Rahim Yar Khan";

const AISLE_LABEL = {
  special: "special sweets",
  seasonal: "seasonal sweets",
  sugarfree: "sugar-free sweets",
  traditional: "traditional mithai",
  breads: "bread",
  rusks: "rusk",
  "dry-cakes": "dry cake",
  "cream-cakes": "cream cake",
  pastries: "pastry",
  "tea-and-coffee": "tea and coffee",
  "tea-coffee": "tea and coffee",
  "sauces-ketchup-mayo": "sauces, ketchup and mayo",
  "butter-cheese-yogurt": "butter, cheese and yogurt",
  "spreads-honey": "spreads and honey",
  "jams-marmalades": "jams and marmalades",
  "oil-ghee": "cooking oil and ghee",
  "milk-cream": "milk and cream",
  "canned-jarred-food": "canned and jarred food",
  "baby-food-formula": "baby food and formula",
  "spices-recipe-mixes": "spices and recipe mixes",
  "achar-pickles": "achar and pickles",
  "baking-desserts": "baking and desserts",
  "packaged-cakes": "packaged cakes",
  "masala-jaat": "masala jaat",
  "personal-care": "personal care",
  "baby-care": "baby care",
  "pest-control": "pest control",
  "ice-cream": "ice cream",
  "dry-fruits": "dry fruits",
  "dry-fruit": "dry fruits",
};
const aisleLabel = (slug) => AISLE_LABEL[slug] ?? slug.replace(/-/g, " ");

const SMALL = new Set(["a", "an", "and", "of", "in", "the", "or", "with", "for"]);
function tidyName(name) {
  // "Badam Barfi — 1 kg" reads better in a sentence as "Badam Barfi (1 kg)".
  // Urdu names sit next to the English one; the description is in English only.
  const first = name
    .replace(/\r\n/g, "\n")
    .split("\n")[0]
    .replace(/[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ — ([^—]+)$/, " ($1)");
  if (/[a-z]/.test(first)) return first;
  return first
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (/\d/.test(word)) return word; // 200ml, 1kg
      if (index > 0 && SMALL.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

const UNIT = {
  kg: "kg", kgs: "kg", g: "g", gm: "g", gms: "g", gram: "g", grams: "g", gr: "g",
  ml: "ml", ltr: "litre", litre: "litre", litres: "litre", liter: "litre", liters: "litre", l: "litre",
  pound: "pound", pounds: "pound", lb: "pound", lbs: "pound",
  pc: "piece", pcs: "pieces", piece: "piece", pieces: "pieces",
};
function sizeOf(name) {
  const text = name.replace(/\r\n/g, "\n").split("\n")[0];
  if (/\/\s*kgs?\b|\bper\s+kg\b/i.test(text)) return { perKg: true };
  const match = text.match(/(\d+(?:\.\d+)?)\s*(kgs?|gms?|grams?|gr|g|ml|ltrs?|litres?|liters?|l|pounds?|lbs?|pcs|pc|pieces?)\b/i);
  if (!match) return null;
  const amount = match[1];
  let unit = UNIT[match[2].toLowerCase()] ?? match[2].toLowerCase();
  if (unit === "piece" && Number(amount) > 1) unit = "pieces";
  if (unit === "pound" && Number(amount) > 1) unit = "pound";
  return { label: `${amount} ${unit}` };
}

// A few wordings per section so neighbouring products don't read the same; picked by the product id.
function pick(id, options) {
  let h = 0;
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return options[h % options.length];
}

// Bakery shelves, as "a premium ___" and "our ___ range".
const BAKERY_ONE = {
  breads: "bread",
  rusks: "rusk",
  "dry-cakes": "dry cake",
  "cream-cakes": "cream cake",
  pastries: "pastry",
  biscuits: "biscuit",
};
// Sweets shelves, as "one of our premium ___".
const SWEETS_MANY = {
  special: "special sweets",
  seasonal: "seasonal sweets",
  sugarfree: "sugar-free sweets",
  traditional: "traditional sweets",
};
// Aisles whose products are not eaten: no "taste" wording.
const NON_FOOD = new Set(["personal-care", "baby-care", "pest-control"]);

function describe(row) {
  const name = tidyName(row.display || row.name);
  switch (row.section) {
    case "sweets": {
      const kind = SWEETS_MANY[row.aisle] ?? "traditional sweets";
      return pick(row.id, [
        `${name} from ${SHOP} is one of our premium ${kind}, with the finest taste. A Rahim Yar Khan favourite since 1959.`,
        `Enjoy the best taste of ${name}, one of our finest ${kind}. Made the Jallundhar way at ${SHOP}, ${PLACE}.`,
        `${name} is one of the premium ${kind} from ${SHOP}, loved for its rich, authentic taste. Perfect for family, guests and celebrations.`,
      ]);
    }
    case "bakery": {
      const one = BAKERY_ONE[row.aisle];
      return pick(row.id, [
        `${name}, fresh from the ${SHOP} bakery. A premium ${one ?? "bake"}, made for the best taste every day on ${PLACE}.`,
        `Freshly baked ${name} from our bakery, made with care for the best taste. A premium pick from our ${one ? `${one} range` : "bakery"} in Rahim Yar Khan.`,
        `${name} is a premium ${one ?? "bake"} from ${SHOP}, baked fresh for the best taste with your tea, breakfast or celebrations.`,
      ]);
    }
    case "snacks":
      return pick(row.id, [
        `${name}, made fresh at the ${SHOP} snack counter for the best taste. A favourite on ${PLACE}.`,
        `Enjoy hot and tasty ${name} from ${SHOP}, prepared fresh with our finest recipe.`,
        `${name} from ${SHOP}: a premium snack with the best taste, perfect for tea time.`,
      ]);
    case "dry-fruits":
    case "masala-jaat": {
      const kind = aisleLabel(row.section);
      return pick(row.id, [
        `${name}: premium ${kind} from ${SHOP}, selected for the finest quality and best taste.`,
        `Choose the finest ${name} from ${SHOP}, ${PLACE}. Premium ${kind}, carefully selected.`,
        `${name} from the ${kind} counter at ${SHOP}: premium quality for your kitchen, gifts and guests.`,
      ]);
    }
    case "beverage":
      return pick(row.id, [
        `${name}, a refreshing drink from ${SHOP}, ${PLACE}.`,
        `Refresh yourself with ${name}, available at ${SHOP}. Enjoy the best taste with every sip.`,
        `${name} from ${SHOP}: a premium drink for meals, guests and celebrations.`,
      ]);
    case "dairy":
      return pick(row.id, [
        `${name}: premium dairy from ${SHOP}, kept fresh for the best taste.`,
        `Fresh ${name} from the dairy section at ${SHOP}, ${PLACE}.`,
        `${name} from ${SHOP}, a premium choice for your daily kitchen needs.`,
      ]);
    default: {
      const where = row.aisle ? `our ${aisleLabel(row.aisle)} collection` : "our general store";
      // Without an aisle we cannot tell food from household goods, so no taste wording either.
      const food = Boolean(row.aisle) && !NON_FOOD.has(row.aisle);
      return pick(row.id, [
        `${name}: a premium pick from ${where}.`,
        `Shop ${name}, one of the finest picks in ${where}.`,
        food
          ? `${name} from ${SHOP}: premium quality from ${where}, chosen for the best taste.`
          : `${name} from ${SHOP}: premium quality for your home, from ${where}.`,
      ]);
    }
  }
}

const out = {};
const csv = [["id", "section", "aisle", "name", "description"]];
for (const row of rows) {
  if (!row.id || out[row.id]) continue;
  if (row.description && row.description.trim()) continue;
  const text = describe(row).replace(/\s+/g, " ").trim();
  out[row.id] = text;
  csv.push([row.id, row.section, row.aisle ?? "", tidyName(row.display || row.name), text]);
}

const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
const entries = Object.entries(out).map(([id, text]) => `${JSON.stringify(id)}:${JSON.stringify(text)}`);
fs.writeFileSync(path.join(root, "data", "product-descriptions.json"), `{\n${entries.join(",\n")}\n}\n`);
const csvText = csv.map((line) => line.map(quote).join(",")).join("\r\n");
fs.writeFileSync(path.join(root, "descriptions-review.csv"), `﻿${csvText}\r\n`);
console.log(`wrote ${Object.keys(out).length} descriptions`);
