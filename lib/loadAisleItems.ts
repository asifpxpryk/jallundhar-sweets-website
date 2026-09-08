import type { MenuItem } from "@/lib/types";
import aisleItems from "@/data/aisle-items.json";

type AisleCatalog = Record<string, MenuItem[]>;

export function loadAisleItems(aisle: string): MenuItem[] {
  const catalog = aisleItems as AisleCatalog;
  return (catalog[aisle] ?? []).map((item) => ({
    ...item,
    price: Number(item.price),
  }));
}
