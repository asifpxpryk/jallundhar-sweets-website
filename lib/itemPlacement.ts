import { hasCatalogPhoto, keepsComingSoonCards } from "@/lib/catalogPhoto";
import type { MenuItem } from "@/lib/types";
import { assignSection, isSectionSlug } from "@/lib/sections";
import { isGeneralAisle } from "@/lib/generalAisles";
import { bakeryAisleForItem } from "@/lib/bakeryAisles";
import { sweetsAisleForItem } from "@/lib/sweetsAisles";
import aisleItems from "@/data/aisle-items.json";
import type { StoreVisibility } from "@/lib/storeVisibility";
import { placementKey, parsePlacement, isValidPlacement, aislesForSection, SECTION_OPTIONS } from "@/lib/placementOptions";

export { placementKey, parsePlacement, isValidPlacement, aislesForSection, SECTION_OPTIONS };

type AisleCatalog = Record<string, MenuItem[]>;

const catalog = aisleItems as AisleCatalog;

function catalogKeyToPlacement(key: string): string {
  if (key.includes(":")) return key;
  if (isGeneralAisle(key)) return `general:${key}`;
  return key;
}

const defaultPlacementById = new Map<string, string>();
const catalogPlacementsById = new Map<string, string[]>();
for (const [key, items] of Object.entries(catalog)) {
  const placement = catalogKeyToPlacement(key);
  for (const item of items ?? []) {
    if (!item?.id) continue;
    defaultPlacementById.set(item.id, placement);
    const list = catalogPlacementsById.get(item.id);
    if (list) list.push(placement);
    else catalogPlacementsById.set(item.id, [placement]);
  }
}

export function defaultPlacementKey(item: MenuItem): string {
  const fromCatalog = defaultPlacementById.get(item.id);
  if (fromCatalog) return fromCatalog;
  const section = isSectionSlug(item.category_id)
    ? item.category_id
    : assignSection(item.name, item.category_id.split(",").filter(Boolean));
  if (section === "bakery") {
    const aisle = bakeryAisleForItem(item.name);
    return aisle ? `bakery:${aisle}` : "bakery";
  }
  if (section === "sweets") return `sweets:${sweetsAisleForItem(item.name)}`;
  return section;
}

export function effectivePlacementKey(item: MenuItem, vis: StoreVisibility): string {
  return vis.itemAisleKeys?.[item.id] || defaultPlacementKey(item);
}

/**
 * Every placement whose itemsForPlacement() list would include this id, found
 * without building those lists. Lets a single-product lookup skip the aisles
 * that cannot contain it.
 */
export function placementsForItem(id: string, vis: StoreVisibility, menuItems: MenuItem[] = []): Set<string> {
  const placements = new Set<string>();
  const moved = vis.itemAisleKeys?.[id];
  for (const placement of catalogPlacementsById.get(id) ?? []) placements.add(moved || placement);
  for (const item of menuItems) {
    if (item.id === id) placements.add(effectivePlacementKey(item, vis));
  }
  return placements;
}

function uniqueItems(items: MenuItem[]): MenuItem[] {
  const seen = new Set<string>();
  const out: MenuItem[] = [];
  for (const item of items) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push({
      ...item,
      price: Number(item.price),
      is_available: item.is_available !== false,
    });
  }
  return out;
}

export function countCatalogProducts(
  section: string,
  hiddenItemIds: string[] = [],
  hiddenAisles: string[] = [],
  requirePhoto = false
): number {
  const hiddenIds = new Set(hiddenItemIds);
  const hiddenAisle = new Set(hiddenAisles);
  const seen = new Set<string>();
  for (const [key, items] of Object.entries(catalog)) {
    const placement = catalogKeyToPlacement(key);
    const [sec, aisle = ""] = placement.split(":");
    if (sec !== section) continue;
    if (aisle && hiddenAisle.has(aisle)) continue;
    for (const item of items ?? []) {
      if (!item?.id || seen.has(item.id) || hiddenIds.has(item.id) || item.is_hidden) continue;
      if (requirePhoto && !hasCatalogPhoto(item) && !keepsComingSoonCards(aisle)) continue;
      seen.add(item.id);
    }
  }
  return seen.size;
}

export function itemsForPlacement(
  placement: string,
  vis: StoreVisibility,
  menuItems: MenuItem[] = []
): MenuItem[] {
  const fromCatalog: MenuItem[] = [];
  for (const [key, items] of Object.entries(catalog)) {
    const fallback = catalogKeyToPlacement(key);
    for (const item of items ?? []) {
      if ((vis.itemAisleKeys?.[item.id] || fallback) === placement) {
        fromCatalog.push(item);
      }
    }
  }
  const fromMenu = menuItems.filter((item) => effectivePlacementKey(item, vis) === placement);
  return uniqueItems([...fromCatalog, ...fromMenu]);
}

export function filterByPlacement(
  items: MenuItem[],
  placement: string,
  vis: StoreVisibility,
  fallback: (item: MenuItem) => boolean
): MenuItem[] {
  return items.filter((item) => {
    const key = vis.itemAisleKeys?.[item.id];
    if (key) return key === placement;
    return fallback(item);
  });
}

