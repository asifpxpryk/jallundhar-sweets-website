import type { MenuItem } from "@/lib/types";
import aisleItems from "@/data/aisle-items.json";
import { EMPTY_HOME_SHELF, shelfFlagsFor, type HomeShelf } from "@/lib/storeVisibility";

type AisleCatalog = Record<string, MenuItem[]>;

export function loadAisleItems(aisle: string): MenuItem[] {
  const catalog = aisleItems as AisleCatalog;
  return (catalog[aisle] ?? []).map((item) => ({
    ...item,
    price: Number(item.price),
    is_hidden: Boolean(item.is_hidden),
    is_available: item.is_available !== false,
  }));
}

export function applyMenuOverrides(
  items: MenuItem[],
  overrides: MenuItem[],
  includeHidden: boolean,
  hiddenItemIds: string[] = [],
  bestsellerIds: string[] = [],
  shelf: HomeShelf = EMPTY_HOME_SHELF
): MenuItem[] {
  const byId = new Map(overrides.map((item) => [item.id, item]));
  const hiddenIds = new Set(hiddenItemIds);
  const bestIds = new Set(bestsellerIds);
  const merged = items.map((item) => {
    const override = byId.get(item.id);
    const hidden = Boolean(override?.is_hidden) || hiddenIds.has(item.id);
    const best = Boolean(override?.is_bestseller) || bestIds.has(item.id);
    const flags = shelfFlagsFor([item.id], shelf);
    if (!override) {
      return { ...item, is_hidden: hidden, is_bestseller: best, ...flags };
    }
    return {
      ...item,
      name: override.name ?? item.name,
      price: Number(override.price),
      is_available: override.is_available,
      is_hidden: hidden,
      is_bestseller: best,
      image_url: override.image_url !== undefined ? override.image_url : item.image_url,
      ...flags,
    };
  });
  if (includeHidden) return merged;
  return merged.filter((item) => !item.is_hidden);
}
