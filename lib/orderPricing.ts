/**
 * Server-side order pricing: every cart line is priced again from the shop's own catalogue,
 * so the amount saved (and emailed) is what the shop sells it for, not what a browser sent.
 * Pure functions only; the catalogue lookup lives in lib/orderCatalog.ts.
 */
import { orderUnit } from "@/lib/priceUnit";
import { MAX_WEIGHT_STEPS, ONE_KG_STEPS, weightLabel } from "@/lib/sweetWeight";

export const MAX_ORDER_LINES = 150;
export const MAX_PIECES = 500;
export const MAX_UNIT_PRICE = 1_000_000;
/** Prices are equal when they differ by less than a paisa. */
const SAME_PRICE = 0.005;

/** A cart line as the browser sends it. `unit_price` is per piece, or per 500 g when weighed. */
export type OrderLineInput = {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  weighed: boolean;
};

/** What the shop sells under one cart id right now. */
export type CatalogPrice = {
  name: string;
  /** Price of one piece (or one kg when weighable). The first is today's selling price. */
  prices: number[];
  available: boolean;
  /** Loose mithai that can be ordered in 500 g steps. */
  weighable: boolean;
};

/** One `order_items` row. */
export type PricedOrderLine = {
  product_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  size: string | null;
  unit_qty: number;
};

/** Sent back to the browser so it can fix the cart before the customer orders again. */
export type CartChange = { id: string; name: string; price?: number; removed?: true };

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Reads the browser's lines; null when any line is malformed. */
export function parseOrderLines(raw: unknown): OrderLineInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ORDER_LINES) return null;
  const lines: OrderLineInput[] = [];
  const seen = new Set<string>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const row = entry as Record<string, unknown>;
    const id = text(row.id, 120);
    const name = text(row.name, 200);
    const quantity = Number(row.quantity);
    const unitPrice = Number(row.unit_price);
    const weighed = row.weighed === true;
    const maxQuantity = weighed ? MAX_WEIGHT_STEPS : MAX_PIECES;
    if (!id || !name || seen.has(id)) return null;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) return null;
    if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > MAX_UNIT_PRICE) return null;
    seen.add(id);
    lines.push({ id, name, quantity, unit_price: unitPrice, weighed });
  }
  return lines;
}

/** The row as the shop reads it: a weighed sweet is one line "Badam Barfi — 1.5 kg" at its full amount. */
function orderRow(id: string, name: string, quantity: number, stepPrice: number, weighed: boolean): PricedOrderLine {
  if (weighed) {
    const size = weightLabel(quantity);
    const amount = stepPrice * quantity;
    return {
      product_id: id,
      item_name: `${name} — ${size}`,
      quantity: 1,
      unit_price: amount,
      line_total: amount,
      size,
      unit_qty: quantity / ONE_KG_STEPS,
    };
  }
  return {
    product_id: id,
    item_name: name,
    quantity,
    unit_price: stepPrice,
    line_total: stepPrice * quantity,
    size: orderUnit(name),
    unit_qty: quantity,
  };
}

/**
 * Prices every line from the catalogue. Any line whose price moved, or that can no longer be
 * ordered, comes back in `changes`; the order is only saved when there are none.
 */
export function priceOrderLines(
  lines: OrderLineInput[],
  catalog: Map<string, CatalogPrice | null>
): { lines: PricedOrderLine[]; changes: CartChange[] } {
  const priced: PricedOrderLine[] = [];
  const changes: CartChange[] = [];
  for (const line of lines) {
    const entry = catalog.get(line.id);
    if (!entry || !entry.available || !entry.prices.length || (line.weighed && !entry.weighable)) {
      changes.push({ id: line.id, name: entry?.name || line.name, removed: true });
      continue;
    }
    const perStep = line.weighed ? ONE_KG_STEPS : 1;
    const stepPrices = entry.prices.map((price) => price / perStep);
    const match = stepPrices.find((price) => Math.abs(price - line.unit_price) < SAME_PRICE);
    const stepPrice = match ?? stepPrices[0];
    if (match === undefined) changes.push({ id: line.id, name: entry.name, price: stepPrice });
    priced.push(orderRow(line.id, entry.name, line.quantity, stepPrice, line.weighed));
  }
  return { lines: priced, changes };
}

/** Used only when the catalogue itself cannot be read: the browser's prices, marked unchecked. */
export function unpricedOrderLines(lines: OrderLineInput[]): PricedOrderLine[] {
  return lines.map((line) => orderRow(line.id, line.name, line.quantity, line.unit_price, line.weighed));
}
