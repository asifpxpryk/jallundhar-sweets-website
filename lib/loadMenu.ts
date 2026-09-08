import { createClient } from "@supabase/supabase-js";
import { unstable_cache, revalidateTag } from "next/cache";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { SECTIONS, assignSection, isHiddenMenuItem, collapseCheesePizzas, isSectionSlug, type SectionSlug } from "@/lib/sections";
import localMenu from "@/data/menu-items.json";

type StoredMenuItem = MenuItem & {
  woo_category_slugs?: string[];
};

function sectionForItem(item: StoredMenuItem): SectionSlug {
  if (isSectionSlug(item.category_id)) return item.category_id;
  const slugs =
    item.woo_category_slugs?.length
      ? item.woo_category_slugs
      : item.category_id.split(",").filter(Boolean);
  return assignSection(item.name, slugs);
}

function groupItems(items: StoredMenuItem[], includeUnavailable = false): MenuCategory[] {
  const grouped = new Map<SectionSlug, MenuItem[]>();
  for (const section of SECTIONS) grouped.set(section.slug, []);

  items.forEach((item) => {
    if (!includeUnavailable && !item.is_available) return;
    if (isHiddenMenuItem(item.name)) return;
    const slug = sectionForItem(item);
    grouped.get(slug)?.push({
      id: item.id,
      category_id: slug,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      image_url: item.image_url,
      is_available: item.is_available,
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
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, category_id, name, description, price, image_url, is_available, sort_order")
      .order("sort_order")
      .abortSignal(controller.signal);

    if (error || !data) return [];
    return data as MenuItem[];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function loadMenuUncached(): Promise<MenuCategory[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const fromDb = await loadFromSupabase();
    return groupItems(fromDb);
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
    return fromDb.map((item) => ({ ...item, price: Number(item.price) }));
  }
  return (localMenu as StoredMenuItem[]).map((item) => ({
    ...item,
    price: Number(item.price),
  }));
}

export function refreshMenuCache() {
  revalidateTag("menu");
}

export const loadMenu = unstable_cache(loadMenuUncached, ["jallundhar-menu-v6"], {
  revalidate: 60,
  tags: ["menu"],
});
