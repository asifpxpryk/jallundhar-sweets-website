import rawProducts from "@/data/pos-beverages-raw.json";

type RawProduct = { pos_name: string; pos_sale_price: string };

/** Beverage name key: lower case, "1 Ltr" → "1l", "500 ML" → "500ml", punctuation dropped. */
export function normalizedBeverageName(name: string) {
  return name
    .toLowerCase()
    .replace(
      /(\d+(?:\.\d+)?)\s*(ltr|liter|litre|litres|liters|l|ml)\b/g,
      (_match, amount: string, unit: string) => `${amount}${unit === "ml" ? "ml" : "l"}`
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

let priceByName: Map<string, number> | null = null;

/** POS sale price by beverage name (first POS row wins). Built on first use, so importing this is cheap. */
export function posPreviewPrice(name: string): number | undefined {
  if (!priceByName) {
    priceByName = new Map();
    for (const product of rawProducts as RawProduct[]) {
      const key = normalizedBeverageName(product.pos_name);
      if (!priceByName.has(key)) priceByName.set(key, Number(product.pos_sale_price));
    }
  }
  return priceByName.get(normalizedBeverageName(name));
}
