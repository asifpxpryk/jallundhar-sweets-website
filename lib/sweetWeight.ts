import { orderUnit } from "@/lib/priceUnit";
import type { CartLine, MenuItem } from "@/lib/types";

/** Cart steps per button: a weighed line counts 500 g steps. */
export const HALF_KG_STEP = 1;
export const ONE_KG_STEPS = 2;
/** 50 kg in one line is the most a shopper can add. */
export const MAX_WEIGHT_STEPS = 100;
/** Loose mithai is priced per kg; anything cheaper than this with no unit is a cup or piece. */
const MIN_PER_KG_PRICE = 500;
const PACKED = /\b(dibbi|dibba|box|cup|piece|pieces|pcs|packing|pack|tin|gift|bag)\b/i;
const KG_IN_NAME = /\s+—\s+1 kg\b/;

function isSweetsCategory(categoryId: string): boolean {
  return categoryId.split(",").some((part) => part.trim().toLowerCase() === "sweets");
}

/** Loose mithai sold by weight: added in 500 g / 1 kg steps instead of pieces. */
export function isWeighedSweet(item: Pick<MenuItem, "name" | "category_id" | "price" | "variants">): boolean {
  if (!isSweetsCategory(item.category_id || "") || item.variants?.length) return false;
  const firstLine = item.name.split(/\r?\n/)[0];
  const unit = orderUnit(firstLine);
  if (unit) return unit === "1 kg";
  return !PACKED.test(firstLine) && item.price >= MIN_PER_KG_PRICE;
}

/** 1 step = "500 g", 3 steps = "1.5 kg". */
export function weightLabel(steps: number): string {
  if (steps === HALF_KG_STEP) return "500 g";
  return `${steps / ONE_KG_STEPS} kg`;
}

/** What the cart shows beside a line: "1.5 kg" for mithai, "2" for everything else. */
export function lineAmountLabel(line: Pick<CartLine, "quantity" | "weighed">): string {
  return line.weighed ? weightLabel(line.quantity) : String(line.quantity);
}

/** A weighed line is one item in the cart badge, whatever its weight. */
export function cartItemCount(line: Pick<CartLine, "quantity" | "weighed">): number {
  return line.weighed ? 1 : line.quantity;
}

/** Cart line for a weighed sweet; `item` is the shopper line (name and per-kg price already set). */
export function weighedCartLine(item: Pick<MenuItem, "id" | "name" | "price">, steps: number): CartLine {
  return {
    id: item.id,
    name: item.name.replace(KG_IN_NAME, "").trim(),
    price: item.price / ONE_KG_STEPS,
    quantity: steps,
    weighed: true,
  };
}

/** Merges an incoming line into the same product's cart line, keeping the rupee value right. */
export function mergeCartLine(existing: CartLine, incoming: CartLine): CartLine {
  if (Boolean(existing.weighed) === Boolean(incoming.weighed)) {
    const quantity = existing.quantity + incoming.quantity;
    return { ...existing, quantity: existing.weighed ? Math.min(MAX_WEIGHT_STEPS, quantity) : quantity };
  }
  if (incoming.weighed) {
    // An older per-kg line (quantity = kilos) turns into 500 g steps.
    const steps = existing.quantity * ONE_KG_STEPS + incoming.quantity;
    return { ...incoming, quantity: Math.min(MAX_WEIGHT_STEPS, steps) };
  }
  const extraSteps = Math.max(1, Math.round((incoming.price * incoming.quantity) / existing.price));
  return { ...existing, quantity: Math.min(MAX_WEIGHT_STEPS, existing.quantity + extraSteps) };
}
