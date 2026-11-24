import { unstable_cache } from "next/cache";
// Namespace import with the file extension: it also has to load under plain Node (the unit tests).
import * as requestStore from "next/dist/client/components/static-generation-async-storage.external.js";

type RequestStore = { getStore(): { urlPathname?: string; readsListingsCopy?: boolean } | undefined };
const staticGenerationAsyncStorage: RequestStore | undefined =
  (requestStore as { staticGenerationAsyncStorage?: RequestStore }).staticGenerationAsyncStorage ??
  (requestStore as { default?: { staticGenerationAsyncStorage?: RequestStore } }).default?.staticGenerationAsyncStorage;

/**
 * Two copies of the cached menu, so one changed product does not throw away 4,300 product pages.
 *
 * Next.js marks a page with the tag of every cached read it makes, and revalidating a tag drops every
 * page that carries it. Listing pages (home, sections, aisles, search, feed) read the copy tagged "menu",
 * which is refreshed on every change. Product pages read a second copy tagged "menu-products", refreshed
 * only on a full storefront refresh, plus their own row under "product:<id>" (see loadMenu.ts) and the
 * "more from this shelf" strip under "related:<shelf>" (see relatedProducts.ts). A change to one product
 * therefore rebuilds the listings, that product's page and the pages whose strip shows it; the rest stay cached.
 *
 * The product pages' copy is a snapshot taken when the site is built (its cache key carries BUILD_ID, so a
 * new deployment never starts from an older deployment's snapshot). A product that was renamed, moved,
 * hidden, added or removed since then no longer fits the snapshot: its page reads the listings' copy
 * instead (readListingsCopy), which is always current.
 */

/** Set once per build in next.config.mjs. */
export const BUILD_ID = process.env.MENU_BUILD_ID || "dev";

export const MENU_TAG = "menu";
export const PRODUCT_PAGES_TAG = "menu-products";
export const WEEK_SECONDS = 604800;
/**
 * How long a product page lives if nothing refreshes it (30 days; keep app/product/[id]/page.tsx's
 * `revalidate` equal). A changed product is refreshed by its own tag, so a weekly expiry only made
 * crawlers re-render every product page each week.
 */
export const PRODUCT_PAGE_SECONDS = 2592000;

export function productTag(id: string) {
  return `product:${id}`;
}

/** Carried by every product page of one shelf (an aisle, a section, a menu category). */
export function relatedTag(key: string) {
  return `related:${key}`;
}

/**
 * True while a product page is being rendered. If Next.js ever stops exposing the path here this
 * answers false, and product pages go back to reading the "menu" copy (correct, only less cached).
 */
export function onProductPage(): boolean {
  try {
    const store = staticGenerationAsyncStorage?.getStore();
    return !store?.readsListingsCopy && (store?.urlPathname?.startsWith("/product/") ?? false);
  } catch {
    return false;
  }
}

/**
 * For the rest of this request, read the listings' copy: the product being shown has changed in a way
 * the build-time snapshot can't describe. The page is then rebuilt on every change, like a listing page.
 */
export function readListingsCopy() {
  try {
    const store = staticGenerationAsyncStorage?.getStore();
    if (store) store.readsListingsCopy = true;
  } catch {
    // Without the store onProductPage() already answers false.
  }
}

/** A cached value built from the menu, kept once for listing pages and once for product pages. */
export function menuScopedCache<T>(build: () => Promise<T>, key: string, extraTags: string[] = []) {
  const forListings = unstable_cache(build, [key], { revalidate: WEEK_SECONDS, tags: [MENU_TAG, ...extraTags] });
  const forProductPages = unstable_cache(build, [`${key}-product-pages`, BUILD_ID], {
    revalidate: PRODUCT_PAGE_SECONDS,
    tags: [PRODUCT_PAGES_TAG, ...extraTags],
  });
  return () => (onProductPage() ? forProductPages() : forListings());
}
