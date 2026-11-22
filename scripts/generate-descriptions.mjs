// Writes a plain 2–3 sentence description for every product that has none.
// Usage: node scripts/generate-descriptions.mjs <catalog-dump.json>
// The dump is { rows: [{ id, name, display, section, aisle, description }] } (from the dev-only slug dump route).
// Output: data/product-descriptions.json (used by the site) and descriptions-review.csv (for review).
// Only facts the catalogue already holds are used: the name, its size/weight and where it is sold. No ingredient,
// health or quality claims.
import fs from "node:fs";
import path from "node:path";

const [, , dumpPath] = process.argv;
if (!dumpPath) {
  console.error("usage: node scripts/generate-descriptions.mjs <catalog-dump.json>");
  process.exit(1);
}
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const { rows } = JSON.parse(fs.readFileSync(dumpPath, "utf8"));

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

function describe(row) {
  const name = tidyName(row.display || row.name);
  const size = sizeOf(row.name) ?? sizeOf(row.display || "");
  const aisle = row.aisle ? aisleLabel(row.aisle) : null;
  const sizeText = size?.perKg ? " The price shown is per kg." : size?.label ? ` Size: ${size.label}.` : "";
  switch (row.section) {
    case "sweets":
      return `${name} is one of the ${aisle ?? "traditional sweets"} sold by ${SHOP} on ${PLACE}.${sizeText}`;
    case "bakery":
      return `${name} is sold by the ${SHOP} bakery on ${PLACE}${aisle ? ` as part of our ${aisle} range` : ""}.${sizeText}`;
    case "snacks":
      return `${name} is served at the ${SHOP} snack counter on ${PLACE}.${sizeText}`;
    case "dry-fruits":
    case "masala-jaat":
      return `${name} is sold at the ${aisleLabel(row.section)} counter of ${SHOP}, ${PLACE}.${sizeText}`;
    case "beverage":
      return `${name} is available in the drinks section at ${SHOP}, ${PLACE}${aisle ? ` (${aisle})` : ""}.${sizeText}`;
    case "dairy":
      return `${name} is available in the dairy section at ${SHOP}, ${PLACE}.${sizeText}`;
    default:
      return `${name} is available at the ${SHOP} general store, ${PLACE}${aisle ? `, in the ${aisle} aisle` : ""}.${sizeText}`;
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
