import { cache } from "react";
import { hasCatalogPhoto } from "@/lib/catalogPhoto";
import { listAisles, listSections } from "@/lib/categoryCatalog";
import { applyMenuOverrides } from "@/lib/loadAisleItems";
import { itemsForPlacement } from "@/lib/itemPlacement";
import { loadAllMenuItemsCached, loadMenu } from "@/lib/loadMenu";
import { homeShelf, loadStoreVisibility } from "@/lib/storeVisibility";
import { findLoosePack } from "@/lib/loosePacks";
import type { MenuItem } from "@/lib/types";

function relatedItems(items: MenuItem[], id: string) {
  return items
    .filter(
      (entry) =>
        entry.id !== id &&
        entry.is_available !== false &&
        !entry.preview_only &&
        hasCatalogPhoto(entry)
    )
    .slice(0, 8);
}

export const loadProduct = cache(async (id: string) => {
  const loose = findLoosePack(id);
  if (loose) {
    return {
      item: loose.item,
      section: loose.section,
      aisle: loose.aisle,
      related: relatedItems(loose.siblings, id),
    };
  }

  const visibility = await loadStoreVisibility();
  const sections = listSections(visibility);
  const overrides = await loadAllMenuItemsCached();

  for (const section of sections) {
    if (section.hidden) continue;

    for (const aisle of listAisles(visibility, section.slug)) {
      if (aisle.hidden) continue;
      const items = applyMenuOverrides(
        itemsForPlacement(`${section.slug}:${aisle.slug}`, visibility, overrides),
        overrides,
        false,
        visibility.hiddenItemIds,
        visibility.bestsellerIds,
        homeShelf(visibility)
      );
      const item = items.find((entry) => entry.id === id);
      if (item) return { item, section, aisle, related: relatedItems(items, id) };
    }

    const items = applyMenuOverrides(
      itemsForPlacement(section.slug, visibility, overrides),
      overrides,
      false,
      visibility.hiddenItemIds,
      visibility.bestsellerIds,
      homeShelf(visibility)
    );
    const item = items.find((entry) => entry.id === id);
    if (item) return { item, section, aisle: null, related: relatedItems(items, id) };
  }

  const categories = await loadMenu();
  for (const category of categories) {
    for (const entry of category.items) {
      const variant = entry.variants?.find((item) => item.id === id);
      if (entry.id !== id && !variant) continue;
      const section = sections.find((candidate) => candidate.slug === category.slug);
      if (!section || section.hidden) continue;
      const item = variant
        ? {
            ...entry,
            id: variant.id,
            name: `${entry.name} (${variant.label})`,
            price: variant.price,
            is_available: variant.is_available !== false,
            variants: undefined,
          }
        : entry;
      return { item, section, aisle: null, related: relatedItems(category.items, item.id) };
    }
  }

  return null;
});
