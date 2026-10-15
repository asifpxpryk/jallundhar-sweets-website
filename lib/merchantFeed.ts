import { unstable_cache } from "next/cache";
import gtinData from "@/data/pos-gtins.json";
import { loadSearchCatalog } from "@/lib/searchCatalog";
import { buildBrandIndex } from "@/lib/catalogBrand";
import { SITE_BRAND, SITE_CITY, SITE_NAME } from "@/lib/site";
import type { MenuItem } from "@/lib/types";

/** Feed-only helpers (Merchant Center). Site names, prices and pages are not affected. */

const GTINS = (gtinData as { gtins: Record<string, string> }).gtins;

/** Validated GTIN from the POS backup (check digit verified when the map was generated). */
export function feedGtin(id: string): string | null {
  return GTINS[id] ?? null;
}

const OWN_SECTIONS = new Set(["sweets", "bakery", "snacks", "dairy"]);

/** Brand: ours only for own sections; otherwise explicit company or a brand detected from the aisle's names. */
export function makeFeedBrand(items: { item: MenuItem; section: string; aisle: string }[]) {
  const groups = new Map<string, MenuItem[]>();
  for (const entry of items) {
    const key = `${entry.section}:${entry.aisle}`;
    groups.set(key, [...(groups.get(key) ?? []), entry.item]);
  }
  const indexes = new Map([...groups].map(([key, list]) => [key, buildBrandIndex(list)]));
  return (item: MenuItem, section: string, aisle: string): string | null => {
    if (OWN_SECTIONS.has(section)) return SITE_BRAND;
    const company = item.company?.trim();
    if (company && !/other|unbranded/i.test(company)) return company;
    const index = indexes.get(`${section}:${aisle}`);
    const brand = index?.choiceFor(item);
    return brand && !/other/i.test(brand) ? brand : null;
  };
}

/** schema.org property for a GTIN by length (gtin8/12/13/14). */
export function gtinProperty(gtin: string): "gtin8" | "gtin12" | "gtin13" | "gtin14" | "gtin" {
  return gtin.length === 8 ? "gtin8" : gtin.length === 12 ? "gtin12" : gtin.length === 13 ? "gtin13" : gtin.length === 14 ? "gtin14" : "gtin";
}

/**
 * Brand per product id, computed once per render from the whole visible catalog (same rule as the feed:
 * ours for own sections, explicit company, or a brand detected from the aisle's product names).
 */
const loadBrandRecord = unstable_cache(
  async () => {
  const catalog = await loadSearchCatalog();
  const seen = new Set<string>();
  const entries: { item: MenuItem; section: string; aisle: string }[] = [];
  for (const category of catalog) {
    for (const item of category.items) {
      if (!item.id || item.preview_only || item.is_hidden || seen.has(item.id)) continue;
      seen.add(item.id);
      entries.push({ item, section: category.slug, aisle: item.search_aisle ?? "" });
    }
  }
  const brandOf = makeFeedBrand(entries);
  const record: Record<string, string | null> = {};
  for (const { item, section, aisle } of entries) record[item.id] = brandOf(item, section, aisle);
  return record;
  },
  ["jallundhar-brand-lookup-v1"],
  { revalidate: 43200, tags: ["menu", "store-visibility"] }
);

export async function loadBrandLookup() {
  return new Map(Object.entries(await loadBrandRecord()));
}

const KEEP_UPPER = new Set(["ABC", "UHT", "BBQ", "KFC", "XL", "XXL", "HD", "UK", "USA", "UAE", "PK", "DX", "NB", "OK", "TUC", "LU", "RIO", "7UP", "ORS"]);

function titleCaseWord(word: string) {
  if (KEEP_UPPER.has(word.replace(/[^A-Z0-9]/g, ""))) return word;
  // sizes: 800G -> 800g, 1.5LTR -> 1.5Ltr, 250ML -> 250ml, 1KG -> 1kg
  const size = word.match(/^(\d+(?:\.\d+)?)(G|GM|GMS|KG|ML|L|LTR|LTRS|PCS|PC|MG|X)$/);
  if (size) {
    const unit = size[2].toLowerCase();
    return size[1] + (unit === "ltr" || unit === "ltrs" ? "Ltr" : unit === "l" ? "L" : unit);
  }
  return word.toLowerCase().replace(/(^|[-/(&'])([a-z])/g, (_, p, c) => p + c.toUpperCase());
}

export function feedTitle(name: string): string {
  let t = name
    .replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  let perKg = false;
  t = t.replace(/(\s*\/\s*kg\b)+/gi, () => {
    perKg = true;
    return "";
  }).trim();
  t = t.replace(/\s*\|\s*/g, " – ").replace(/\s+/g, " ").replace(/[\s–-]+$/, "").trim();
  const letters = t.replace(/[^A-Za-z]/g, "");
  if (letters.length > 3 && letters === letters.toUpperCase()) t = t.split(" ").map(titleCaseWord).join(" ");
  if (perKg) t = `${t} (per kg)`;
  return t;
}

const KIND: Record<string, string> = {
  bakery: "freshly baked item",
  sweets: "traditional Pakistani mithai",
  snacks: "freshly made snack",
  dairy: "dairy product",
  beverage: "drink",
  general: "packaged grocery item",
  celebrations: "celebration gift",
};

/** Product-focused description: own text if present, otherwise what it is and where it is sold (no price/phone/promo). */
export function feedDescription(item: MenuItem, title: string, section: string, productType: string, brand: string | null) {
  const own = item.description?.replace(/\s+/g, " ").trim();
  if (own && own.toLowerCase() !== item.name.trim().toLowerCase()) return own;
  const kind = KIND[section] ?? "item";
  const made = OWN_SECTIONS.has(section) ? `made by ${SITE_NAME}` : brand ? `by ${brand}` : "";
  return `${title}: ${kind}${made ? ` ${made}` : ""}. Category: ${productType}. Available at ${SITE_NAME}, Shahi Road, ${SITE_CITY}, with home delivery in ${SITE_CITY}.`;
}

export function feedProductType(value: string) {
  return value.replace(/^Beverages\b/, "Beverage");
}