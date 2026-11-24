import { unstable_cache } from "next/cache";
// Namespace import with the file extension: it also has to load under plain Node (the unit tests).
import * as requestStore from "next/dist/client/components/static-generation-async-storage.external.js";

type RequestStore = { getStore(): { urlPathname?: string } | undefined };
const staticGenerationAsyncStorage: RequestStore | undefined =
  (requestStore as { staticGenerationAsyncStorage?: RequestStore }).staticGenerationAsyncStorage ??
  (requestStore as { default?: { staticGenerationAsyncStorage?: RequestStore } }).default?.staticGenerationAsyncStorage;

/**
 * Two copies of the cached menu, so one changed product does not throw away 4,300 product pages.
 *
 * Next.js marks a page with the tag of every cached read it makes, and revalidating a tag drops every
 * page that carries it. Listing pages (home, sections, aisles, search, feed) read the copy tagged "menu",
 * which is refreshed on every change. Product pages read a second copy tagged "menu-products", refreshed
 * only on a full storefront refresh, plus their own row under "product:<id>" (see loadMenu.ts). A rate or
 * photo change therefore rebuilds the listings and that one product page; the other product pages stay cached.
 */

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

/**
 * True while a product page is being rendered. If Next.js ever stops exposing the path here this
 * answers false, and product pages go back to reading the "menu" copy (correct, only less cached).
 */
export function onProductPage(): boolean {
  try {
    return staticGenerationAsyncStorage?.getStore()?.urlPathname?.startsWith("/product/") ?? false;
  } catch {
    return false;
  }
}

/** A cached value built from the menu, kept once for listing pages and once for product pages. */
export function menuScopedCache<T>(build: () => Promise<T>, key: string, extraTags: string[] = []) {
  const forListings = unstable_cache(build, [key], { revalidate: WEEK_SECONDS, tags: [MENU_TAG, ...extraTags] });
  const forProductPages = unstable_cache(build, [`${key}-product-pages`], {
    revalidate: PRODUCT_PAGE_SECONDS,
    tags: [PRODUCT_PAGES_TAG, ...extraTags],
  });
  return () => (onProductPage() ? forProductPages() : forListings());
}
