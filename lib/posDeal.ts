/**
 * Deals sent by the shop POS for linked items. A deal sells at its price until `deal_ends_at`
 * (no end means it runs until the shop removes it); once it ends it is ignored everywhere,
 * including the server's order re-pricing. Checked at use time, so cached pages can't extend it.
 */
import { dealPrice } from "@/lib/dealPrice";
import type { MenuItem } from "@/lib/types";

export type PosDeal = { price: number; label: string };

type DealFields = Pick<MenuItem, "pos_deal_price" | "pos_deal_label" | "pos_deal_ends_at">;
type ShelfFields = Pick<MenuItem, "is_deal" | "deal_label">;

/** The shop deal running at `now`, or null when there is none or it has ended. */
export function activePosDeal(item: DealFields, now: number = Date.now()): PosDeal | null {
  const raw = item.pos_deal_price;
  if (raw === null || raw === undefined || (raw as unknown) === "") return null;
  const price = Number(raw);
  if (!Number.isFinite(price) || price <= 0) return null;
  if (item.pos_deal_ends_at) {
    const ends = Date.parse(item.pos_deal_ends_at);
    if (!Number.isFinite(ends) || ends <= now) return null;
  }
  return { price, label: (item.pos_deal_label ?? "").trim() };
}

/** Selling price under a deal (shop deal first, then a numeric website deal line), and its label. */
export function dealFor(item: DealFields & ShelfFields, now: number = Date.now()): { sale: number | null; label: string } {
  const pos = activePosDeal(item, now);
  if (pos) return { sale: pos.price, label: pos.label };
  if (!item.is_deal) return { sale: null, label: "" };
  return { sale: dealPrice(item.deal_label), label: item.deal_label ?? "" };
}

/** What a card shows: the sale price when it differs from `price`, and a label unless it only repeats that price. */
export function dealShown(
  item: DealFields & ShelfFields,
  price: number,
  now: number = Date.now()
): { sale: number | null; label: string } {
  const { sale, label } = dealFor(item, now);
  const showSale = sale !== null && sale !== price;
  return {
    sale: showSale ? sale : null,
    label: label && (!showSale || dealPrice(label) === null) ? label : "",
  };
}

/** The POS columns a merged item carries over from its menu_items row (nothing when the row has none). */
export function posFields(row: Partial<MenuItem> | undefined): Partial<MenuItem> {
  if (!row) return {};
  const fields: Partial<MenuItem> = {};
  if (row.pos_linked) {
    fields.pos_linked = true;
    fields.pos_product_id = row.pos_product_id ?? null;
  }
  if (row.pos_deal_price !== undefined && row.pos_deal_price !== null) {
    fields.pos_deal_price = row.pos_deal_price;
    fields.pos_deal_label = row.pos_deal_label ?? null;
    fields.pos_deal_ends_at = row.pos_deal_ends_at ?? null;
  }
  return fields;
}
