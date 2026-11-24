import { menuScopedCache } from "@/lib/menuScope";
import { loadSearchCatalog } from "@/lib/searchCatalog";

/**
 * Sections with no product a shopper can open (e.g. "Celebrations" before any gift box is listed).
 * They stay out of the menus and the sitemap until a product is added; the page itself still loads.
 */
async function emptySectionSlugs(): Promise<string[]> {
  const catalog = await loadSearchCatalog();
  return catalog
    .filter((category) => !category.items.some((item) => !item.is_hidden && !item.preview_only))
    .map((category) => category.slug);
}

export const loadEmptySectionSlugs = menuScopedCache(emptySectionSlugs, "empty-section-slugs-v2", ["store-visibility"]);
