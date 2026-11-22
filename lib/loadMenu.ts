import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { SECTIONS, assignSection, isHiddenMenuItem, collapseCheesePizzas, isSectionSlug, normalizeName, type SectionSlug } from "@/lib/sections";
import { listSections } from "@/lib/categoryCatalog";
import { isAdminSession } from "@/lib/adminAuth";
import { loadStoreVisibility, loadStoreVisibilityUncached, isVisibilityConfigId, shelfFlagsFor, EMPTY_HOME_SHELF, type HomeShelf } from "@/lib/storeVisibility";
import localMenu from "@/data/menu-items.json";
import aisleCatalog from "@/data/aisle-items.json";
import { selectWithColumnFallback } from "@/lib/menuColumns";
import { posFields } from "@/lib/posDeal";

type StoredMenuItem = MenuItem & {
  woo_category_slugs?: string[];
};

const AISLE_ITEM_IDS = new Set(
  Object.values(aisleCatalog as Record<string, { id: string }[]>).flatMap((rows) =>
    rows.map((row) => row.id)
  )
);

/** category_id may be "section" or "section:aisle" (rows the POS bridge adds). */
function categorySection(categoryId: string): string {
  return categoryId.split(":")[0] ?? categoryId;
}

/** The shop POS decides hide for linked rows, so the website hide list doesn't apply to them. */
function hiddenByList(item: MenuItem, hiddenIds: Set<string>): boolean {
  return !item.pos_linked && hiddenIds.has(item.id);
}

function sectionForItem(item: StoredMenuItem): SectionSlug {
  const section = categorySection(item.category_id);
  if (isSectionSlug(section)) return section;
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
    const hidden = Boolean(item.is_hidden) || hiddenByList(item, hiddenIds);
    if (hidden && !includeHidden) return;
    if (isHiddenMenuItem(item.name)) return;
    if (normalizeName(item.name) === "chicken leg piece" && item.category_id === "general") return;
    const ownSection = categorySection(item.category_id);
    const slug = extraSlugs.has(ownSection) ? ownSection : sectionForItem(item);
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
      ...posFields(item),
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
        hiddenByList(item, hiddenIds) ||
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
  let columnSet = 0;

  try {
    const rows: MenuItem[] = [];
    for (let from = 0; ; from += MENU_PAGE_SIZE) {
      const page = await selectWithColumnFallback<unknown[]>(
        (columns) =>
          supabase
            .from("menu_items")
            .select(columns)
            .order("sort_order", { ascending: true })
            .order("id", { ascending: true })
            .range(from, from + MENU_PAGE_SIZE - 1)
            .abortSignal(controller.signal),
        columnSet
      );
      columnSet = page.columnSet;
      const { data, error } = page;
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

/** One 1000-row page of menu rows; throws on a failed read so a bad page is never cached. */
async function loadMenuRowsPage(from: number): Promise<MenuItem[]> {
  if (process.env.JALLUNDHAR_LOCAL_PREVIEW === "1") return [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key);
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const { data, error } = await selectWithColumnFallback<unknown[]>((columns) =>
        supabase
          .from("menu_items")
          .select(columns)
          .order("sort_order", { ascending: true })
          .order("id", { ascending: true })
          .range(from, from + MENU_PAGE_SIZE - 1)
          .abortSignal(controller.signal)
      );
      if (!error && data) return data as unknown as MenuItem[];
    } catch {
      /* tried again below */
    } finally {
      clearTimeout(timeout);
    }
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
  }
  throw new Error("Could not load the full menu from Supabase.");
}

/**
 * The menu is cached one page of rows at a time. Next.js refuses to cache a value over 2 MB, and the whole
 * catalogue passed that (4,300 rows): the single cached copy was silently never stored, so every page that
 * was not cached yet read all the rows from Supabase again (2 to 5 seconds a page).
 */
const loadMenuRowsPageCached = unstable_cache(loadMenuRowsPage, ["jallundhar-menu-rows-page-v1"], {
  revalidate: 604800,
  tags: ["menu"],
});

/** Every menu row, from the cached pages; read once per request. */
const loadMenuRowsCached = cache(async (): Promise<MenuItem[]> => {
  const rows: MenuItem[] = [];
  for (let from = 0; ; from += MENU_PAGE_SIZE) {
    const page = await loadMenuRowsPageCached(from);
    rows.push(...page);
    if (page.length < MENU_PAGE_SIZE) return rows;
  }
});

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
      is_hidden: Boolean(item.is_hidden) || hiddenByList(item, hiddenIds),
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

/** The grouped menu from the cached rows and the cached store settings (grouping itself takes milliseconds). */
async function groupedFromCache(includeHidden: boolean): Promise<MenuCategory[]> {
  const vis = await loadStoreVisibility();
  const extras = extraSections(vis);
  const rows = await loadMenuRowsCached();
  if (rows.length) return groupedFromDbOrLocal(rows, includeHidden, vis.hiddenItemIds, vis.bestsellerIds, extras, vis);
  const local = loadFromLocal(includeHidden, vis.hiddenItemIds, vis.bestsellerIds, extras, vis);
  return local.some((category) => category.items.length > 0) || includeHidden ? local : [];
}

export const loadMenuIncludingHidden = cache(() => groupedFromCache(true));

export async function loadStorefrontMenu() {
  if (await isAdminSession()) return loadMenuIncludingHidden();
  return loadMenu();
}

export function refreshMenuCache() {
  revalidateTag("menu");
}

export const loadMenu = cache(() => groupedFromCache(false));

/** Storefront copy of loadAllMenuItems: the rows come from the cached pages (read again on an admin save or a POS refresh). */
export const loadAllMenuItemsCached = cache(async (): Promise<MenuItem[]> => {
  const vis = await loadStoreVisibility();
  const rows = await loadMenuRowsCached();
  return withHiddenFlags(rows.length ? rows : (localMenu as StoredMenuItem[]), vis.hiddenItemIds, vis.bestsellerIds, vis);
});
