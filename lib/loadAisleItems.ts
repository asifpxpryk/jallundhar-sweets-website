import type { MenuItem } from "@/lib/types";
import aisleItems from "@/data/aisle-items.json";

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
  hiddenItemIds: string[] = []
): MenuItem[] {
  const byId = new Map(overrides.map((item) => [item.id, item]));
  const hiddenIds = new Set(hiddenItemIds);
  const merged = items.map((item) => {
    const override = byId.get(item.id);
    const hidden = Boolean(override?.is_hidden) || hiddenIds.has(item.id);
    if (!override) {
      return { ...item, is_hidden: hidden };
    }
    return {
      ...item,
      price: Number(override.price),
      is_available: override.is_available,
      is_hidden: hidden,
    };
  });
  if (includeHidden) return merged;
  return merged.filter((item) => !item.is_hidden);
}
