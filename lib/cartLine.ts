import { dealPrice } from "@/lib/dealPrice";
import { customerProductName } from "@/lib/productName";
import type { MenuItem } from "@/lib/types";

type Variant = NonNullable<MenuItem["variants"]>[number];

/** A deal whose label is only a number sells at that number. */
export function withDealPrice(item: MenuItem): MenuItem {
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
