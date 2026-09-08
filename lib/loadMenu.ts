import { createClient } from "@supabase/supabase-js";
import { unstable_cache, revalidateTag } from "next/cache";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { SECTIONS, assignSection, isHiddenMenuItem, collapseCheesePizzas, isSectionSlug, normalizeName, type SectionSlug } from "@/lib/sections";
import { isAdminSession } from "@/lib/adminAuth";
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

function groupItems(items: StoredMenuItem[], includeHidden = false): MenuCategory[] {
  const grouped = new Map<SectionSlug, MenuItem[]>();
  for (const section of SECTIONS) grouped.set(section.slug, []);

  items.forEach((item) => {
    if (AISLE_ITEM_IDS.has(item.id)) return;
    if (item.is_hidden && !includeHidden) return;
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
      is_hidden: Boolean(item.is_hidden),
      sort_order: item.sort_order,
    });
  });

  return SECTIONS.map((section, i) => ({
    id: section.slug,
    slug: section.slug,
    name: section.name,
    sort_order: i,
    items: collapseCheesePizzas(grouped.get(section.slug) || []),
  }));
}

function loadFromLocal(): MenuCategory[] {
  const items = localMenu as StoredMenuItem[];
  if (!items.length) return [];
  return groupItems(items);
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

function groupedFromDbOrLocal(fromDb: MenuItem[], includeHidden = false): MenuCategory[] {
  const grouped = groupItems(fromDb, includeHidden);
  if (menuHasItems(grouped)) return grouped;
  const local = groupItems(localMenu as StoredMenuItem[], includeHidden);
  return menuHasItems(local) ? local : grouped;
}

async function loadMenuUncached(): Promise<MenuCategory[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const fromDb = await loadFromSupabase();
    return groupedFromDbOrLocal(fromDb);
  }

  const local = loadFromLocal();
  if (local.some((category) => category.items.length > 0)) return local;
  return [];
}

export async function loadAllMenuItems(): Promise<MenuItem[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const fromDb = await loadFromSupabase();
    if (fromDb.length) return fromDb.map((item) => ({ ...item, price: Number(item.price) }));
  }
  return (localMenu as StoredMenuItem[]).map((item) => ({
    ...item,
    price: Number(item.price),
  }));
}

async function loadMenuIncludingHiddenUncached(): Promise<MenuCategory[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const fromDb = await loadFromSupabase();
    return groupedFromDbOrLocal(fromDb, true);
  }

  const items = localMenu as StoredMenuItem[];
  return groupItems(items, true);
}

export const loadMenuIncludingHidden = unstable_cache(
  loadMenuIncludingHiddenUncached,
  ["jallundhar-menu-v9-admin"],
  { revalidate: 60, tags: ["menu"] }
);

export async function loadStorefrontMenu() {
  if (await isAdminSession()) return loadMenuIncludingHidden();
  return loadMenu();
}

export function refreshMenuCache() {
  revalidateTag("menu");
}

export const loadMenu = unstable_cache(loadMenuUncached, ["jallundhar-menu-v9"], {
  revalidate: 60,
  tags: ["menu"],
});
