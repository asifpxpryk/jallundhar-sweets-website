import { createClient } from "@supabase/supabase-js";
import { unstable_cache, revalidateTag } from "next/cache";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { SECTIONS, assignSection, isHiddenMenuItem, collapseCheesePizzas, isSectionSlug, normalizeName, type SectionSlug } from "@/lib/sections";
import { isAdminSession } from "@/lib/adminAuth";
import { loadStoreVisibility, isVisibilityConfigId } from "@/lib/storeVisibility";
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
  bestsellerIds: string[] = []
): MenuCategory[] {
  const grouped = new Map<SectionSlug, MenuItem[]>();
  const hiddenIds = new Set(hiddenItemIds);
  const bestIds = new Set(bestsellerIds);
  for (const section of SECTIONS) grouped.set(section.slug, []);

  items.forEach((item) => {
    if (AISLE_ITEM_IDS.has(item.id)) return;
    if (isVisibilityConfigId(item.id)) return;
    const hidden = Boolean(item.is_hidden) || hiddenIds.has(item.id);
    if (hidden && !includeHidden) return;
    if (isHiddenMenuItem(item.name)) return;
    if (normalizeName(item.name) === "chicken leg piece" && item.category_id === "general") return;
    const slug = sectionForItem(item);
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
    });
  });

  return SECTIONS.map((section, i) => ({
    id: section.slug,
    slug: section.slug,
    name: section.name,
    sort_order: i,
    items: collapseCheesePizzas(grouped.get(section.slug) || []).map((item) => ({
      ...item,
      is_bestseller:
        Boolean(item.is_bestseller) ||
        bestIds.has(item.id) ||
        Boolean(item.variants?.some((variant) => bestIds.has(variant.id))),
    })),
  }));
}

function loadFromLocal(
  includeHidden = false,
  hiddenItemIds: string[] = [],
  bestsellerIds: string[] = []
): MenuCategory[] {
  const items = localMenu as StoredMenuItem[];
  if (!items.length) return [];
  return groupItems(items, includeHidden, hiddenItemIds, bestsellerIds);
}

async function loadFromSupabase(): Promise<MenuItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, category_id, name, description, price, image_url, is_available, is_hidden, sort_order")
      .order("sort_order")
      .abortSignal(controller.signal);

    if (error) {
      const fallback = await supabase
        .from("menu_items")
        .select("id, category_id, name, description, price, image_url, is_available, sort_order")
        .order("sort_order")
        .abortSignal(controller.signal);
      if (fallback.error || !fallback.data) return [];
      return fallback.data as MenuItem[];
    }
    if (!data) return [];
    return data as MenuItem[];
  } catch {
    return [];
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
  bestsellerIds: string[] = []
): MenuCategory[] {
  const grouped = groupItems(fromDb, includeHidden, hiddenItemIds, bestsellerIds);
  if (menuHasItems(grouped)) return grouped;
  const local = groupItems(localMenu as StoredMenuItem[], includeHidden, hiddenItemIds, bestsellerIds);
  return menuHasItems(local) ? local : grouped;
}

function withHiddenFlags(
  items: MenuItem[],
  hiddenItemIds: string[],
  bestsellerIds: string[] = []
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
    }));
}

async function loadMenuUncached(): Promise<MenuCategory[]> {
  const vis = await loadStoreVisibility();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const fromDb = await loadFromSupabase();
    return groupedFromDbOrLocal(fromDb, false, vis.hiddenItemIds, vis.bestsellerIds);
  }

  const local = loadFromLocal(false, vis.hiddenItemIds, vis.bestsellerIds);
  if (local.some((category) => category.items.length > 0)) return local;
  return [];
}

export async function loadAllMenuItems(): Promise<MenuItem[]> {
  const vis = await loadStoreVisibility();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const fromDb = await loadFromSupabase();
    if (fromDb.length) return withHiddenFlags(fromDb, vis.hiddenItemIds, vis.bestsellerIds);
  }
  return withHiddenFlags(localMenu as StoredMenuItem[], vis.hiddenItemIds, vis.bestsellerIds);
}

async function loadMenuIncludingHiddenUncached(): Promise<MenuCategory[]> {
  const vis = await loadStoreVisibility();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const fromDb = await loadFromSupabase();
    return groupedFromDbOrLocal(fromDb, true, vis.hiddenItemIds, vis.bestsellerIds);
  }

  const items = localMenu as StoredMenuItem[];
  return groupItems(items, true, vis.hiddenItemIds, vis.bestsellerIds);
}

export const loadMenuIncludingHidden = unstable_cache(
  loadMenuIncludingHiddenUncached,
  ["jallundhar-menu-v14-admin"],
  { revalidate: 60, tags: ["menu"] }
);

export async function loadStorefrontMenu() {
  if (await isAdminSession()) return loadMenuIncludingHidden();
  return loadMenu();
}

export function refreshMenuCache() {
  revalidateTag("menu");
}

export const loadMenu = unstable_cache(loadMenuUncached, ["jallundhar-menu-v14"], {
  revalidate: 60,
  tags: ["menu"],
});
