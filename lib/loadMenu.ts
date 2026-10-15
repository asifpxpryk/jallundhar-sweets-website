import { createClient } from "@supabase/supabase-js";
import { unstable_cache, revalidateTag } from "next/cache";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { SECTIONS, assignSection, isHiddenMenuItem, collapseCheesePizzas, isSectionSlug, normalizeName, type SectionSlug } from "@/lib/sections";
import { listSections } from "@/lib/categoryCatalog";
import { isAdminSession } from "@/lib/adminAuth";
import { loadStoreVisibilityUncached, isVisibilityConfigId, shelfFlagsFor, EMPTY_HOME_SHELF, type HomeShelf } from "@/lib/storeVisibility";
import localMenu from "@/data/menu-items.json";
import aisleCatalog from "@/data/aisle-items.json";

type StoredMenuItem = MenuItem & {
  woo_category_slugs?: string[];
};

const AISLE_ITEM_IDS = new Set(
  Object.values(aisleCatalog as Record<string, { id: string }[]>).flatMap((rows) =>
    rows.map((row) => row.id)
  )
);

function sectionForItem(item: StoredMenuItem): SectionSlug {
  if (isSectionSlug(item.category_id)) return item.category_id;
  const slugs =
    item.woo_category_slugs?.length
      ? item.woo_category_slugs
      : item.category_id.split(",").filter(Boolean);
  return assignSection(item.name, slugs);
}

function groupItems(
  items: StoredMenuItem[],
  includeHidden = false,
  hiddenItemIds: string[] = [],
  bestsellerIds: string[] = [],
  extraSections: { slug: string; name: string }[] = [],
  shelf: HomeShelf = EMPTY_HOME_SHELF
): MenuCategory[] {
  const grouped = new Map<string, MenuItem[]>();
  const hiddenIds = new Set(hiddenItemIds);
  const bestIds = new Set(bestsellerIds);
  const extras = extraSections.filter((section) => !SECTIONS.some((builtin) => builtin.slug === section.slug));
  const extraSlugs = new Set(extras.map((section) => section.slug));
  for (const section of SECTIONS) grouped.set(section.slug, []);
  for (const section of extras) grouped.set(section.slug, []);

  items.forEach((item) => {
    if (AISLE_ITEM_IDS.has(item.id)) return;
    if (isVisibilityConfigId(item.id)) return;
    const hidden = Boolean(item.is_hidden) || hiddenIds.has(item.id);
    if (hidden && !includeHidden) return;
    if (isHiddenMenuItem(item.name)) return;
    if (normalizeName(item.name) === "chicken leg piece" && item.category_id === "general") return;
    const slug = extraSlugs.has(item.category_id) ? item.category_id : sectionForItem(item);
    grouped.get(slug)?.push({
      id: item.id,
      category_id: slug,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      image_url: item.image_url,
      is_available: item.is_available,
      is_hidden: hidden,
      is_bestseller: Boolean(item.is_bestseller) || bestIds.has(item.id),
      sort_order: item.sort_order,
      ...shelfFlagsFor([item.id], shelf),
    });
  });

  return [...SECTIONS, ...extras].map((section, i) => ({
    id: section.slug,
    slug: section.slug,
    name: section.name,
    sort_order: i,
    items: collapseCheesePizzas(grouped.get(section.slug) || []).map((item) => ({
      ...item,
      is_hidden:
        Boolean(item.is_hidden) ||
        hiddenIds.has(item.id) ||
        Boolean(item.variants?.length && item.variants.every((variant) => hiddenIds.has(variant.id))),
      is_bestseller:
        Boolean(item.is_bestseller) ||
        bestIds.has(item.id) ||
        Boolean(item.variants?.some((variant) => bestIds.has(variant.id))),
      ...shelfFlagsFor([item.id, ...(item.variants?.map((variant) => variant.id) ?? [])], shelf),
    })),
  }));
}

function loadFromLocal(
  includeHidden = false,
  hiddenItemIds: string[] = [],
  bestsellerIds: string[] = [],
  extraSections: { slug: string; name: string }[] = [],
  shelf: HomeShelf = EMPTY_HOME_SHELF
): MenuCategory[] {
  const items = localMenu as StoredMenuItem[];
  if (!items.length) return [];
  return groupItems(items, includeHidden, hiddenItemIds, bestsellerIds, extraSections, shelf);
}

const MENU_PAGE_SIZE = 1000;
const MENU_COLUMNS =
  "id, category_id, name, description, price, image_url, is_available, is_hidden, sort_order";
const MENU_COLUMNS_WITHOUT_HIDDEN =
  "id, category_id, name, description, price, image_url, is_available, sort_order";

/**
 * Reads every menu row from Supabase (paged in 1000-row chunks).
 * A failed or partial read throws instead of returning [] or a truncated list, so ISR and
 * unstable_cache keep the last good page rather than caching the old local JSON fallback
 * (which only knows a few items, e.g. Dairy showing 2 products).
 */
async function loadFromSupabase(): Promise<MenuItem[]> {
  if (process.env.JALLUNDHAR_LOCAL_PREVIEW === "1") return [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const rows = await loadFromSupabaseOnce(url, key);
    if (rows) return rows;
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
  throw new Error("Could not load the full menu from Supabase.");
}

async function loadFromSupabaseOnce(url: string, key: string): Promise<MenuItem[] | null> {
  const supabase = createClient(url, key);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let columns = MENU_COLUMNS;

  try {
    const rows: MenuItem[] = [];
    for (let from = 0; ; from += MENU_PAGE_SIZE) {
      let { data, error } = await supabase
        .from("menu_items")
        .select(columns)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true })
        .range(from, from + MENU_PAGE_SIZE - 1)
        .abortSignal(controller.signal);

      if (error && columns === MENU_COLUMNS) {
        columns = MENU_COLUMNS_WITHOUT_HIDDEN;
        ({ data, error } = await supabase
          .from("menu_items")
          .select(columns)
          .order("sort_order", { ascending: true })
          .order("id", { ascending: true })
          .range(from, from + MENU_PAGE_SIZE - 1)
          .abortSignal(controller.signal));
      }
      if (error || !data) return null;
      rows.push(...(data as unknown as MenuItem[]));
      if (data.length < MENU_PAGE_SIZE) return rows;
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function menuHasItems(categories: MenuCategory[]) {
  return categories.some((category) => category.items.length > 0);
}

function groupedFromDbOrLocal(
  fromDb: MenuItem[],
  includeHidden = false,
  hiddenItemIds: string[] = [],
  bestsellerIds: string[] = [],
  extraSections: { slug: string; name: string }[] = [],
  shelf: HomeShelf = EMPTY_HOME_SHELF
): MenuCategory[] {
  const grouped = groupItems(fromDb, includeHidden, hiddenItemIds, bestsellerIds, extraSections, shelf);
  if (menuHasItems(grouped)) return grouped;
  const local = groupItems(localMenu as StoredMenuItem[], includeHidden, hiddenItemIds, bestsellerIds, extraSections, shelf);
  return menuHasItems(local) ? local : grouped;
}

function withHiddenFlags(
  items: MenuItem[],
  hiddenItemIds: string[],
  bestsellerIds: string[] = [],
  shelf: HomeShelf = EMPTY_HOME_SHELF
): MenuItem[] {
  const hiddenIds = new Set(hiddenItemIds);
  const bestIds = new Set(bestsellerIds);
  return items
    .filter((item) => !isVisibilityConfigId(item.id))
    .map((item) => ({
      ...item,
      price: Number(item.price),
      is_hidden: Boolean(item.is_hidden) || hiddenIds.has(item.id),
      is_bestseller: Boolean(item.is_bestseller) || bestIds.has(item.id),
      ...shelfFlagsFor([item.id], shelf),
    }));
}

function extraSections(vis: Parameters<typeof listSections>[0]) {
  return listSections(vis)
    .filter((section) => section.custom)
    .map((section) => ({
      slug: section.slug,
      name: section.name,
    }));
}

async function loadMenuUncached(): Promise<MenuCategory[]> {
  const vis = await loadStoreVisibilityUncached();
  const extras = extraSections(vis);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const fromDb = await loadFromSupabase();
    return groupedFromDbOrLocal(fromDb, false, vis.hiddenItemIds, vis.bestsellerIds, extras, vis);
  }

  const local = loadFromLocal(false, vis.hiddenItemIds, vis.bestsellerIds, extras, vis);
  if (local.some((category) => category.items.length > 0)) return local;
  return [];
}

export async function loadAllMenuItems(): Promise<MenuItem[]> {
  const vis = await loadStoreVisibilityUncached();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const fromDb = await loadFromSupabase();
    if (fromDb.length) return withHiddenFlags(fromDb, vis.hiddenItemIds, vis.bestsellerIds, vis);
  }
  return withHiddenFlags(localMenu as StoredMenuItem[], vis.hiddenItemIds, vis.bestsellerIds, vis);
}

export async function loadMenuIncludingHiddenUncached(): Promise<MenuCategory[]> {
  const vis = await loadStoreVisibilityUncached();
  const extras = extraSections(vis);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const fromDb = await loadFromSupabase();
    return groupedFromDbOrLocal(fromDb, true, vis.hiddenItemIds, vis.bestsellerIds, extras, vis);
  }

  const items = localMenu as StoredMenuItem[];
  return groupItems(items, true, vis.hiddenItemIds, vis.bestsellerIds, extras, vis);
}

export const loadMenuIncludingHidden = unstable_cache(
  loadMenuIncludingHiddenUncached,
  ["jallundhar-menu-v28-admin"],
  { revalidate: 43200, tags: ["menu"] }
);

export async function loadStorefrontMenu() {
  if (await isAdminSession()) return loadMenuIncludingHidden();
  return loadMenu();
}

export function refreshMenuCache() {
  revalidateTag("menu");
}

export const loadMenu = unstable_cache(loadMenuUncached, ["jallundhar-menu-v28"], {
  revalidate: 43200,
  tags: ["menu"],
});

/** Storefront copy of loadAllMenuItems: one Supabase read per hour (or on admin save via the "menu"/"store-visibility" tags). */
export const loadAllMenuItemsCached = unstable_cache(loadAllMenuItems, ["jallundhar-all-menu-items-v1"], {
  revalidate: 43200,
  tags: ["menu", "store-visibility"],
});
