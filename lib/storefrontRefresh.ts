import { revalidatePath } from "next/cache";
import { SECTIONS } from "@/lib/sections";
import { GENERAL_AISLES } from "@/lib/generalAisles";
import { BEVERAGE_AISLES } from "@/lib/beverageAisles";
import { BAKERY_AISLES } from "@/lib/bakeryAisles";
import { SWEETS_AISLES } from "@/lib/sweetsAisles";
import { listAisles, listSections } from "@/lib/categoryCatalog";
import { loadStoreVisibilityUncached, refreshStoreVisibility } from "@/lib/storeVisibility";
import { refreshMenuCache, refreshMenuProducts } from "@/lib/loadMenu";

/**
 * Some products' rate, photo, description or stock changed. The listings are rebuilt, and those
 * products' own pages; every other product page stays cached (see menuScope.ts).
 */
export function refreshProducts(ids: string[]) {
  refreshMenuProducts(ids);
}

/** Drops every cached menu read and storefront page, so the next visitor sees the saved catalogue. */
export async function refreshStorefront() {
  refreshMenuCache();
  refreshStoreVisibility();
  revalidatePath("/account");
  revalidatePath("/account/categories");
  revalidatePath("/account/banners");
  revalidatePath("/", "layout");
  revalidatePath("/categories");
  revalidatePath("/general");
  for (const section of SECTIONS) {
    revalidatePath(`/${section.slug}`);
  }
  for (const aisle of GENERAL_AISLES) {
    revalidatePath(`/general/${aisle.slug}`);
  }
  for (const aisle of BEVERAGE_AISLES) {
    revalidatePath(`/beverage/${aisle.slug}`);
  }
  for (const aisle of BAKERY_AISLES) {
    revalidatePath(`/bakery/${aisle.slug}`);
  }
  for (const aisle of SWEETS_AISLES) {
    revalidatePath(`/sweets/${aisle.slug}`);
  }
  try {
    const vis = await loadStoreVisibilityUncached();
    for (const section of listSections(vis)) {
      revalidatePath(section.href);
      for (const aisle of listAisles(vis, section.slug)) revalidatePath(aisle.href);
    }
  } catch {
    /* Builtin paths above are already refreshed. */
  }
}
