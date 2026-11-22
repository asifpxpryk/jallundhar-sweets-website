import { unstable_cache } from "next/cache";
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

export const loadEmptySectionSlugs = unstable_cache(emptySectionSlugs, ["empty-section-slugs-v2"], {
  revalidate: 604800,
  tags: ["menu", "store-visibility"],
});
