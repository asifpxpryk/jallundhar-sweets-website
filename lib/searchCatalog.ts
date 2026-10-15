import { listAisles, listSections } from "@/lib/categoryCatalog";
import { applyMenuOverrides } from "@/lib/loadAisleItems";
import { loadAllMenuItemsCached, loadMenu } from "@/lib/loadMenu";
import { itemsForPlacement } from "@/lib/itemPlacement";
import { beveragePreviewItems, tagBeverageItems } from "@/lib/posBeveragePreview";
import { looseSearchCategories } from "@/lib/loosePacks";
import { homeShelf, loadStoreVisibility } from "@/lib/storeVisibility";
import type { MenuCategory, MenuItem } from "@/lib/types";

function dedupe(items: MenuItem[]): MenuItem[] {
  const seen = new Set<string>();
  const out: MenuItem[] = [];
  for (const item of items) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

/** Every product a customer can open, including general-store aisles the menu feed skips. */
export async function loadSearchCatalog(): Promise<MenuCategory[]> {
  const visibility = await loadStoreVisibility();
  const [categories, overrides] = await Promise.all([loadMenu(), loadAllMenuItemsCached()]);

  const sections = listSections(visibility)
    .filter((section) => !section.hidden)
    .map((section, index) => {
      const placed: MenuItem[] = [];
      for (const aisle of listAisles(visibility, section.slug)) {
        if (aisle.hidden) continue;
        const aisleItems = applyMenuOverrides(
          itemsForPlacement(`${section.slug}:${aisle.slug}`, visibility, overrides),
          overrides,
          false,
          visibility.hiddenItemIds,
          visibility.bestsellerIds,
          homeShelf(visibility)
        );
        for (const item of aisleItems) {
          placed.push({ ...item, search_aisle: aisle.slug });
        }
      }

      const menuItems = categories.find((category) => category.slug === section.slug)?.items ?? [];
      let items = dedupe([...placed, ...menuItems]);
      if (section.slug === "beverage") {
        items = beveragePreviewItems(tagBeverageItems(items), undefined, overrides);
      }

      return {
        id: section.slug,
        slug: section.slug,
        name: section.name,
        sort_order: index,
        items,
      };
    });
  return [...sections, ...looseSearchCategories()];
}
