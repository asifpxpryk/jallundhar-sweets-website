import { cache } from "react";
import { listAisles, listSections } from "@/lib/categoryCatalog";
import { applyMenuOverrides } from "@/lib/loadAisleItems";
import { itemsForPlacement } from "@/lib/itemPlacement";
import { loadAllMenuItems } from "@/lib/loadMenu";
import { loadStoreVisibility } from "@/lib/storeVisibility";

export const loadProduct = cache(async (id: string) => {
  const visibility = await loadStoreVisibility();
  const sections = listSections(visibility);
  const overrides = await loadAllMenuItems();

  for (const slug of ["sweets", "bakery"]) {
    const section = sections.find((entry) => entry.slug === slug);
    if (!section || section.hidden) continue;

    for (const aisle of listAisles(visibility, slug)) {
      if (aisle.hidden) continue;
      const items = applyMenuOverrides(
        itemsForPlacement(`${slug}:${aisle.slug}`, visibility, overrides),
        overrides,
        false,
        visibility.hiddenItemIds,
        visibility.bestsellerIds
      );
      const item = items.find((entry) => entry.id === id);
      if (item) return { item, section, aisle };
    }

    if (slug === "bakery") {
      const items = applyMenuOverrides(
        itemsForPlacement(slug, visibility, overrides),
        overrides,
        false,
        visibility.hiddenItemIds,
        visibility.bestsellerIds
      );
      const item = items.find((entry) => entry.id === id);
      if (item) return { item, section, aisle: null };
    }
  }

  return null;
});
