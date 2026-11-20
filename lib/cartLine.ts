import { dealPrice } from "@/lib/dealPrice";
import { activePosDeal } from "@/lib/posDeal";
import { customerProductName } from "@/lib/productName";
import type { MenuItem } from "@/lib/types";

type Variant = NonNullable<MenuItem["variants"]>[number];

/** A running shop (POS) deal sells at its price; otherwise a deal whose label is only a number sells at that number. */
export function withDealPrice(item: MenuItem, now: number = Date.now()): MenuItem {
  const pos = activePosDeal(item, now);
  if (pos) return pos.price === item.price ? item : { ...item, price: pos.price };
  if (!item.is_deal) return item;
  const sale = dealPrice(item.deal_label);
  if (sale == null || sale === item.price) return item;
  return { ...item, price: sale };
}

/** What goes into the cart for a product (or one of its sizes): shopper name and selling price. */
export function productLine(item: MenuItem, selected?: Variant): MenuItem {
  const name = customerProductName(
    selected ? `${item.name} (${selected.label})` : item.name,
    item.category_id
  );
  if (!selected) return { ...withDealPrice(item), name };
  return {
    ...item,
    id: selected.id,
    name,
    price: selected.price,
    is_available: selected.is_available !== false,
  };
}
