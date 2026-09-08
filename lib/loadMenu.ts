import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { SECTIONS, assignSection, type SectionSlug } from "@/lib/sections";

const SUPABASE_URL = "https://szynajbvvgazmtzxxxde.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6eW5hamJ2dmdhem10enh4eGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODMwMzMsImV4cCI6MjEwNDM1OTAzM30.Hv7D8Nd9yQSD1Kz19gZAp-JeyVx2uvz57Usj8Rw1Sv4";

type WooProduct = {
  id: number;
  name: string;
  short_description?: string;
  description?: string;
  prices?: { price?: string; currency_minor_unit?: number };
  images?: { src?: string }[];
  categories?: { slug: string }[];
  is_in_stock?: boolean;
};

function stripHtml(html: string | undefined): string | null {
  if (!html) return null;
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text || null;
}

function groupItems(items: MenuItem[]): MenuCategory[] {
  const grouped = new Map<SectionSlug, MenuItem[]>();
  for (const section of SECTIONS) grouped.set(section.slug, []);

  items.forEach((item) => {
    const slug = assignSection(item.name, [item.category_id]);
    grouped.get(slug)?.push({ ...item, category_id: slug });
  });

  return SECTIONS.map((section, i) => ({
    id: section.slug,
    slug: section.slug,
    name: section.name,
    sort_order: i,
    items: grouped.get(section.slug) || [],
  }));
}

async function loadFromWoo(): Promise<MenuCategory[]> {
  const products: WooProduct[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(
      `https://jallundharmain.com/wp-json/wc/store/v1/products?per_page=100&page=${page}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) break;
    const batch = (await res.json()) as WooProduct[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    products.push(...batch);
    if (batch.length < 100) break;
  }

  const grouped = new Map<SectionSlug, MenuItem[]>();
  for (const section of SECTIONS) grouped.set(section.slug, []);

  products.forEach((p, index) => {
    const slugs = (p.categories || []).map((c) => c.slug);
    const section = assignSection(p.name, slugs);
    const minor = p.prices?.currency_minor_unit ?? 2;
    const raw = Number(p.prices?.price || 0);
    const price = minor > 0 ? raw / 10 ** minor : raw;
    grouped.get(section)?.push({
      id: String(p.id),
      category_id: section,
      name: p.name,
      description: stripHtml(p.short_description) || stripHtml(p.description),
      price,
      image_url: p.images?.[0]?.src || null,
      is_available: p.is_in_stock !== false,
      sort_order: index,
    });
  });

  return SECTIONS.map((section, i) => ({
    id: section.slug,
    slug: section.slug,
    name: section.name,
    sort_order: i,
    items: grouped.get(section.slug) || [],
  }));
}

async function loadFromSupabase(): Promise<MenuItem[]> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 800);

  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, category_id, name, description, price, image_url, is_available, sort_order")
      .eq("is_available", true)
      .order("sort_order")
      .abortSignal(controller.signal);

    if (error || !data?.length) return [];
    return data as MenuItem[];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function loadMenuUncached(): Promise<MenuCategory[]> {
  const wooPromise = loadFromWoo();
  const fromDb = await loadFromSupabase();
  if (fromDb.length > 0) return groupItems(fromDb);
  return wooPromise;
}

export const loadMenu = unstable_cache(loadMenuUncached, ["jallundhar-menu"], {
  revalidate: 300,
});
