import { createHash } from "crypto";
import { unstable_cache } from "next/cache";
import { hasCatalogPhoto } from "@/lib/catalogPhoto";
import { listAisles, listSections } from "@/lib/categoryCatalog";
import { itemsForPlacement } from "@/lib/itemPlacement";
import { applyMenuOverrides } from "@/lib/loadAisleItems";
import { catalogFromRows, loadMenuRowsUncached } from "@/lib/loadMenu";
import { BUILD_ID, PRODUCT_PAGES_TAG, PRODUCT_PAGE_SECONDS, relatedTag } from "@/lib/menuScope";
import { homeShelf, type StoreVisibility } from "@/lib/storeVisibility";
import type { MenuCategory, MenuItem } from "@/lib/types";

/**
 * The "more from this shelf" strip on a product page: the first few products of the shelf the product
 * sits on (an aisle, a section, or a menu category), so every product page of one shelf shows the same
 * strip. It is cached once per shelf under "related:<shelf>". When the POS hides, renames, adds or
 * reprices one of those first products, the POS refresh sees the shelf's strip change and rebuilds
 * that shelf's product pages only (see menuScope.ts).
 */

const SHOWN = 8;

type Catalog = { visibility: StoreVisibility; overrides: MenuItem[]; categories: MenuCategory[] };

/** A shelf's key: "section:aisle", "section", or "menu:<category>". */
export function menuShelfKey(categorySlug: string) {
  return `menu:${categorySlug}`;
}

/** The products a shelf's strip can show: one more than is shown, so the page's own product can be left out. */
export function relatedCandidates(items: MenuItem[]): MenuItem[] {
  return items
    .filter((entry) => entry.is_available !== false && !entry.preview_only && hasCatalogPhoto(entry))
    .slice(0, SHOWN + 1);
}

export function relatedFrom(candidates: MenuItem[], id: string): MenuItem[] {
  return candidates.filter((entry) => entry.id !== id).slice(0, SHOWN);
}

/** The products on one shelf, in the order the storefront lists them. */
export function shelfItems(key: string, { visibility, overrides, categories }: Catalog): MenuItem[] {
  if (key.startsWith("menu:")) return categories.find((category) => category.slug === key.slice(5))?.items ?? [];
  return applyMenuOverrides(
    itemsForPlacement(key, visibility, overrides),
    overrides,
    false,
    visibility.hiddenItemIds,
    visibility.bestsellerIds,
    homeShelf(visibility)
  );
}

function shelfKeys({ visibility, categories }: Catalog): string[] {
  const keys: string[] = [];
  for (const section of listSections(visibility)) {
    if (section.hidden) continue;
    for (const aisle of listAisles(visibility, section.slug)) {
      if (!aisle.hidden) keys.push(`${section.slug}:${aisle.slug}`);
    }
    keys.push(section.slug);
  }
  for (const category of categories) keys.push(menuShelfKey(category.slug));
  return keys;
}

/** A short hash of every shelf's strip, from rows just read: what the POS refresh remembers and compares. */
export async function relatedSignatures(rows: MenuItem[]): Promise<Record<string, string>> {
  const catalog = await catalogFromRows(rows);
  const signatures: Record<string, string> = {};
  for (const key of shelfKeys(catalog)) {
    const candidates = relatedCandidates(shelfItems(key, catalog));
    signatures[key] = createHash("sha256").update(JSON.stringify(candidates)).digest("hex").slice(0, 16);
  }
  return signatures;
}

const BUILDING = process.env.NEXT_PHASE === "phase-production-build";

/**
 * A shelf's strip for a product page that reads the build-time snapshot. While the site is being built
 * `known` (from the rows just read) is used; when the POS refresh drops the entry it is rebuilt from
 * Supabase, because the snapshot the page reads everything else from is older by then.
 */
export function loadRelatedCandidates(key: string, known: MenuItem[]): Promise<MenuItem[]> {
  return unstable_cache(
    async () => (BUILDING ? known : relatedCandidates(shelfItems(key, await catalogFromRows(await loadMenuRowsUncached())))),
    ["jallundhar-related-v1", BUILD_ID, key],
    { revalidate: PRODUCT_PAGE_SECONDS, tags: [relatedTag(key), PRODUCT_PAGES_TAG] }
  )();
}
