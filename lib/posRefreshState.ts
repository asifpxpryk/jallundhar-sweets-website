import { loadMenuRowsUncached } from "@/lib/loadMenu";
import { menuSignatures, saveMenuState, type MenuSignatures, type MenuState } from "@/lib/menuFingerprint";
import { relatedSignatures } from "@/lib/relatedProducts";
import { isVisibilityConfigId } from "@/lib/storeVisibility";
import type { MenuItem } from "@/lib/types";

/** Each row's signature; the store settings row is judged as a whole. */
export function rowSignatures(rows: MenuItem[]): MenuSignatures {
  return menuSignatures(rows as unknown as Record<string, unknown>[], isVisibilityConfigId);
}

/**
 * What the POS refresh remembers about the menu after reading all of it: a signature per row and per
 * shelf's "related" strip, and when this full compare happened.
 */
export async function menuStateFrom(rows: MenuItem[], checkedAt = new Date().toISOString()): Promise<MenuState> {
  return { rows: rowSignatures(rows), related: await relatedSignatures(rows), checkedAt };
}

/**
 * Called while the production site is built, before the product pages are: remembers the menu as the
 * pages are about to be built from it. A POS change that lands during the build, or between this build
 * and the first POS refresh it answers, is then found by that refresh instead of being lost.
 * A failure here only means that first refresh runs in full.
 */
export async function rememberMenuAtBuild() {
  if (process.env.NEXT_PHASE !== "phase-production-build" || process.env.VERCEL_ENV !== "production") return;
  try {
    const rows = await loadMenuRowsUncached();
    if (!rows.length) return;
    const saved = await saveMenuState(await menuStateFrom(rows));
    console.info(saved ? "Menu remembered for the first POS refresh" : "Menu not remembered: the first POS refresh runs in full");
  } catch (error) {
    console.error("Menu not remembered: the first POS refresh runs in full", error);
  }
}
