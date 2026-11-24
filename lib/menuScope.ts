import { unstable_cache } from "next/cache";
import { staticGenerationAsyncStorage } from "next/dist/client/components/static-generation-async-storage.external";

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

export function productTag(id: string) {
  return `product:${id}`;
}

/**
 * True while a product page is being rendered. If Next.js ever stops exposing the path here this
 * answers false, and product pages go back to reading the "menu" copy (correct, only less cached).
 */
export function onProductPage(): boolean {
  try {
    return staticGenerationAsyncStorage.getStore()?.urlPathname?.startsWith("/product/") ?? false;
  } catch {
    return false;
  }
}

/** A cached value built from the menu, kept once for listing pages and once for product pages. */
export function menuScopedCache<T>(build: () => Promise<T>, key: string, extraTags: string[] = []) {
  const forListings = unstable_cache(build, [key], { revalidate: WEEK_SECONDS, tags: [MENU_TAG, ...extraTags] });
  const forProductPages = unstable_cache(build, [`${key}-product-pages`], {
    revalidate: WEEK_SECONDS,
    tags: [PRODUCT_PAGES_TAG, ...extraTags],
  });
  return () => (onProductPage() ? forProductPages() : forListings());
}
