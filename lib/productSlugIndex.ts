import { menuScopedCache } from "@/lib/menuScope";
import { scopedMemo } from "@/lib/scopedMemo";
import { loadSearchCatalog } from "@/lib/searchCatalog";
import { productSlug } from "@/lib/productSlug";
import legacySlugs from "@/data/product-legacy-slugs.json";

type SlugIndex = {
  /** slug -> stored product id */
  bySlug: Record<string, string>;
  /** stored product id -> its one canonical slug */
  byId: Record<string, string>;
};

const LEGACY = legacySlugs as Record<string, string>;
const LEGACY_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(LEGACY).map(([id, slug]) => [slug, id])
);

async function buildSlugIndex(): Promise<SlugIndex> {
  const catalog = await loadSearchCatalog();
  const bySlug: Record<string, string> = {};
  const byId: Record<string, string> = {};
  const add = (id: string, name: string, categoryId: string, sectionSlug: string) => {
    if (!id || byId[id]) return;
    const slug = productSlug({ id, name, category_id: categoryId || sectionSlug });
    if (bySlug[slug] && bySlug[slug] !== id) {
      // Two products with the same name: keep the first, give the next one its id on the end.
      const unique = `${slug}-${id.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
      bySlug[unique] = id;
      byId[id] = unique;
      return;
    }
    bySlug[slug] = id;
    byId[id] = slug;
    // A card shown under its section (not its stored category) builds the same name; accept that spelling too.
    const alt = productSlug({ id, name, category_id: sectionSlug });
    if (!bySlug[alt]) bySlug[alt] = id;
  };
  for (const category of catalog) {
    for (const item of category.items) {
      if (item.preview_only) continue;
      add(item.id, item.name, item.category_id, category.slug);
      for (const variant of item.variants ?? []) {
        add(variant.id, `${item.name} (${variant.label})`, item.category_id, category.slug);
      }
    }
  }
  return { bySlug, byId };
}

/** Rebuilt with the menu (admin save / POS refresh revalidate these tags). */
export const loadSlugIndex = scopedMemo(menuScopedCache(buildSlugIndex, "product-slug-index-v2", ["store-visibility"]));

/**
 * Stored id for a URL segment: a current slug, a slug a product had before it was renamed, or an old id.
 * `otherwise` is the id an older copy of the index gave for the segment (a product renamed since the
 * site was built): the page then redirects to the product's new address instead of answering 404.
 */
export async function resolveProductParam(param: string, otherwise?: string): Promise<string> {
  const index = await loadSlugIndex();
  return index.bySlug[param] ?? LEGACY_BY_SLUG[param] ?? otherwise ?? param;
}

export async function canonicalSlugFor(item: { id: string; name: string; category_id?: string }) {
  const index = await loadSlugIndex();
  return index.byId[item.id] ?? LEGACY[item.id] ?? productSlug(item);
}
