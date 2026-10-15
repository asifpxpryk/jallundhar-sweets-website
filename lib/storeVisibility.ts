import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import { unstable_cache, revalidateTag } from "next/cache";
import { isSectionSlug } from "@/lib/sections";
import { isGeneralAisle } from "@/lib/generalAisles";
import { isBeverageAisle } from "@/lib/beverageAisles";
import { isBakeryAisle } from "@/lib/bakeryAisles";
import { isSweetsAisle } from "@/lib/sweetsAisles";
import {
  isCategorySlug,
  listAisles,
  listSections,
  parseCategoryImages,
  parseCategoryMap,
  parseCustomCategories,
  type CategoryKind,
  type CustomCategory,
} from "@/lib/categoryCatalog";
import fallback from "@/data/store-visibility.json";
import { parseShopExteriorText, type ShopExteriorText } from "@/lib/shopExteriorBanner";

export type { CategoryKind, CustomCategory };

export type StoreVisibility = {
  hiddenSections: string[];
  hiddenAisles: string[];
  hiddenItemIds: string[];
  bestsellerIds: string[];
  newArrivalIds: string[];
  dealIds: string[];
  dealLabels: Record<string, string>;
  itemAisleKeys: Record<string, string>;
  categoryNames: Record<string, string>;
  categoryImages: Record<string, string>;
  customCategories: CustomCategory[];
  bannerPages: Record<string, string[]>;
  shopExteriorText: ShopExteriorText;
};

export const ITEM_VISIBILITY_PREFIX = "item:";
export const VISIBILITY_CONFIG_ID = "store-visibility-config";

export function itemVisibilitySlug(id: string) {
  return `${ITEM_VISIBILITY_PREFIX}${id}`;
}

export function isVisibilityConfigId(id: string) {
  return id === VISIBILITY_CONFIG_ID;
}

type VisibilityRow = {
  kind: CategoryKind;
  slug: string;
  hidden: boolean;
};

function asSet(values: string[]): Set<string> {
  return new Set(values.filter(Boolean));
}

export type HomeShelf = {
  newArrivalIds: string[];
  dealIds: string[];
  dealLabels: Record<string, string>;
};

export const EMPTY_HOME_SHELF: HomeShelf = {
  newArrivalIds: [],
  dealIds: [],
  dealLabels: {},
};

export function homeShelf(vis: HomeShelf): HomeShelf {
  return {
    newArrivalIds: vis.newArrivalIds,
    dealIds: vis.dealIds,
    dealLabels: vis.dealLabels,
  };
}

export function shelfFlagsFor(ids: string[], shelf: HomeShelf) {
  const arrivals = new Set(shelf.newArrivalIds);
  const deals = new Set(shelf.dealIds);
  let is_new_arrival = false;
  let is_deal = false;
  let deal_label = "";
  for (const id of ids) {
    if (!id) continue;
    if (arrivals.has(id)) is_new_arrival = true;
    if (deals.has(id)) is_deal = true;
    if (!deal_label && shelf.dealLabels[id]) deal_label = shelf.dealLabels[id];
  }
  return { is_new_arrival, is_deal, deal_label: is_deal ? deal_label : "" };
}

function parseDealLabels(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!id || typeof value !== "string") continue;
    const text = value.trim().slice(0, 32);
    if (text) out[id] = text;
  }
  return out;
}

function parseAisleKeys(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [id, key] of Object.entries(raw as Record<string, unknown>)) {
    if (id && typeof key === "string" && key.trim()) out[id] = key.trim();
  }
  return out;
}

function parseBannerPages(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string[]> = {};
  for (const [id, pages] of Object.entries(raw as Record<string, unknown>)) {
    if (!id || !Array.isArray(pages)) continue;
    out[id] = [...new Set(pages.filter((page): page is string => typeof page === "string" && page.startsWith("/")))];
  }
  return out;
}

function parseVisibility(raw: unknown): StoreVisibility {
  const data = (raw ?? {}) as Partial<StoreVisibility>;
  return {
    hiddenSections: [...asSet(data.hiddenSections ?? [])],
    hiddenAisles: [...asSet(data.hiddenAisles ?? [])],
    hiddenItemIds: [...asSet(data.hiddenItemIds ?? [])],
    bestsellerIds: [...asSet(data.bestsellerIds ?? [])],
    newArrivalIds: [...asSet(data.newArrivalIds ?? [])],
    dealIds: [...asSet(data.dealIds ?? [])],
    dealLabels: parseDealLabels(data.dealLabels),
    itemAisleKeys: parseAisleKeys(data.itemAisleKeys),
    categoryNames: parseCategoryMap(data.categoryNames),
    categoryImages: parseCategoryImages(data.categoryImages),
    customCategories: parseCustomCategories(data.customCategories),
    bannerPages: parseBannerPages(data.bannerPages),
    shopExteriorText: parseShopExteriorText(data.shopExteriorText),
  };
}

function fromBundledFallback(): StoreVisibility {
  return parseVisibility(fallback);
}

async function loadFallback(): Promise<StoreVisibility> {
  try {
    const file = await fs.readFile(path.join(process.cwd(), "data", "store-visibility.json"), "utf8");
    return parseVisibility(JSON.parse(file));
  } catch {
    return fromBundledFallback();
  }
}

function applyRows(base: StoreVisibility, rows: VisibilityRow[]): StoreVisibility {
  const sections = asSet(base.hiddenSections);
  const aisles = asSet(base.hiddenAisles);
  const items = asSet(base.hiddenItemIds);
  for (const row of rows) {
    if (row.kind === "section" && (isSectionSlug(row.slug) || isCategorySlug(row.slug))) {
      if (row.hidden) sections.add(row.slug);
      else sections.delete(row.slug);
    }
    if (row.kind === "aisle" && row.slug.startsWith(ITEM_VISIBILITY_PREFIX)) {
      const id = row.slug.slice(ITEM_VISIBILITY_PREFIX.length);
      if (id) {
        if (row.hidden) items.add(id);
        else items.delete(id);
      }
      continue;
    }
    if (
      row.kind === "aisle" &&
      (isGeneralAisle(row.slug) ||
        isBeverageAisle(row.slug) ||
        isBakeryAisle(row.slug) ||
        isSweetsAisle(row.slug) ||
        isCategorySlug(row.slug))
    ) {
      if (row.hidden) aisles.add(row.slug);
      else aisles.delete(row.slug);
    }
  }
  return {
    hiddenSections: [...sections],
    hiddenAisles: [...aisles],
    hiddenItemIds: [...items],
    bestsellerIds: [...asSet(base.bestsellerIds)],
    newArrivalIds: [...asSet(base.newArrivalIds)],
    dealIds: [...asSet(base.dealIds)],
    dealLabels: { ...base.dealLabels },
    itemAisleKeys: { ...base.itemAisleKeys },
    categoryNames: { ...base.categoryNames },
    categoryImages: { ...base.categoryImages },
    customCategories: [...base.customCategories],
    bannerPages: { ...base.bannerPages },
    shopExteriorText: base.shopExteriorText,
  };
}

async function loadFromSupabase(): Promise<VisibilityRow[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("store_visibility")
    .select("kind, slug, hidden");

  if (error || !data) return null;
  return data as VisibilityRow[];
}

async function loadConfigFromMenuItems(): Promise<StoreVisibility | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("menu_items")
    .select("description")
    .eq("id", VISIBILITY_CONFIG_ID)
    .maybeSingle();

  if (error || !data?.description) return null;
  try {
    return parseVisibility(JSON.parse(data.description));
  } catch {
    return null;
  }
}

export function visibilityPayload(vis: StoreVisibility) {
  return {
    hiddenSections: vis.hiddenSections,
    hiddenAisles: vis.hiddenAisles,
    hiddenItemIds: vis.hiddenItemIds,
    bestsellerIds: vis.bestsellerIds,
    newArrivalIds: vis.newArrivalIds,
    dealIds: vis.dealIds,
    dealLabels: vis.dealLabels,
    itemAisleKeys: vis.itemAisleKeys,
    categoryNames: vis.categoryNames,
    categoryImages: vis.categoryImages,
    customCategories: vis.customCategories,
    bannerPages: vis.bannerPages,
    shopExteriorText: vis.shopExteriorText,
  };
}

export function visibilityConfigRow(vis: StoreVisibility) {
  return {
    id: VISIBILITY_CONFIG_ID,
    name: "__store_visibility__",
    price: 0,
    category_id: "sweets",
    description: JSON.stringify(visibilityPayload(vis)),
    is_available: false,
    sort_order: -1,
  };
}

export async function loadStoreVisibilityUncached(): Promise<StoreVisibility> {
  const base = await loadFallback();
  if (process.env.JALLUNDHAR_LOCAL_PREVIEW === "1") return base;
  const config = await loadConfigFromMenuItems();
  if (config) {
    return {
      hiddenSections: config.hiddenSections.length ? config.hiddenSections : base.hiddenSections,
      hiddenAisles: config.hiddenAisles.length ? config.hiddenAisles : base.hiddenAisles,
      hiddenItemIds: [...asSet([...base.hiddenItemIds, ...config.hiddenItemIds])],
      bestsellerIds: [...asSet([...base.bestsellerIds, ...config.bestsellerIds])],
      newArrivalIds: [...asSet([...base.newArrivalIds, ...config.newArrivalIds])],
      dealIds: [...asSet([...base.dealIds, ...config.dealIds])],
      dealLabels: { ...base.dealLabels, ...config.dealLabels },
      itemAisleKeys: { ...base.itemAisleKeys, ...config.itemAisleKeys },
      categoryNames: { ...base.categoryNames, ...config.categoryNames },
      categoryImages: { ...base.categoryImages, ...config.categoryImages },
      customCategories: config.customCategories.length ? config.customCategories : base.customCategories,
      bannerPages: { ...base.bannerPages, ...config.bannerPages },
      shopExteriorText: config.shopExteriorText,
    };
  }
  const rows = await loadFromSupabase();
  if (rows) return applyRows(base, rows);
  return base;
}

export const loadStoreVisibility = unstable_cache(
  loadStoreVisibilityUncached,
  ["jallundhar-store-visibility-v11"],
  { revalidate: 43200, tags: ["store-visibility"] }
);

export function refreshStoreVisibility() {
  revalidateTag("store-visibility");
}

export function isSectionHidden(vis: StoreVisibility, slug: string) {
  return vis.hiddenSections.includes(slug);
}

export function isAisleHidden(vis: StoreVisibility, slug: string) {
  return vis.hiddenAisles.includes(slug) || vis.hiddenSections.includes("general");
}

export function isBeverageAisleHidden(vis: StoreVisibility, slug: string) {
  return vis.hiddenAisles.includes(slug) || vis.hiddenSections.includes("beverage");
}

export function isBakeryAisleHidden(vis: StoreVisibility, slug: string) {
  return vis.hiddenAisles.includes(slug) || vis.hiddenSections.includes("bakery");
}

export function isSweetsAisleHidden(vis: StoreVisibility, slug: string) {
  return vis.hiddenAisles.includes(slug) || vis.hiddenSections.includes("sweets");
}

export function visibleSections(vis: StoreVisibility) {
  return listSections(vis)
    .filter((section) => !section.hidden)
    .map((section) => ({
      slug: section.slug,
      name: section.name,
      emoji: section.emoji ?? "🛍️",
      image: section.image,
    }));
}

function visibleSectionAisles(vis: StoreVisibility, section: string) {
  if (isSectionHidden(vis, section)) return [];
  return listAisles(vis, section)
    .filter((aisle) => !aisle.hidden)
    .map((aisle) => ({ slug: aisle.slug, name: aisle.name, image: aisle.image }));
}

export function visibleAisles(vis: StoreVisibility) {
  return visibleSectionAisles(vis, "general");
}

export function visibleBeverageAisles(vis: StoreVisibility) {
  return visibleSectionAisles(vis, "beverage");
}

export function visibleBakeryAisles(vis: StoreVisibility) {
  return visibleSectionAisles(vis, "bakery");
}

export function visibleSweetsAisles(vis: StoreVisibility) {
  return visibleSectionAisles(vis, "sweets");
}

export function applyBestsellerToggle(vis: StoreVisibility, id: string, on: boolean): StoreVisibility {
  const ids = asSet(vis.bestsellerIds);
  if (on) ids.add(id);
  else ids.delete(id);
  return { ...vis, bestsellerIds: [...ids] };
}

export function applyNewArrivalToggle(vis: StoreVisibility, id: string, on: boolean): StoreVisibility {
  const ids = asSet(vis.newArrivalIds);
  if (on) ids.add(id);
  else ids.delete(id);
  return { ...vis, newArrivalIds: [...ids] };
}

export function applyDealToggle(vis: StoreVisibility, id: string, on: boolean, label: string): StoreVisibility {
  const ids = asSet(vis.dealIds);
  const labels = { ...vis.dealLabels };
  const text = label.trim().slice(0, 32);
  if (on) {
    ids.add(id);
    if (text) labels[id] = text;
    else delete labels[id];
  } else {
    ids.delete(id);
    delete labels[id];
  }
  return { ...vis, dealIds: [...ids], dealLabels: labels };
}

export function applyItemPlacement(vis: StoreVisibility, ids: string[], placement: string): StoreVisibility {
  const keys = { ...vis.itemAisleKeys };
  for (const id of ids) {
    if (!id) continue;
    if (placement) keys[id] = placement;
    else delete keys[id];
  }
  return { ...vis, itemAisleKeys: keys };
}

export function applyVisibilityToggle(
  vis: StoreVisibility,
  kind: CategoryKind,
  slug: string,
  hidden: boolean
): StoreVisibility {
  return applyRows(vis, [{ kind, slug, hidden }]);
}

export async function writeStoreVisibilityFallback(vis: StoreVisibility) {
  const file = path.join(process.cwd(), "data", "store-visibility.json");
  await fs.writeFile(
    file,
    `${JSON.stringify(visibilityPayload(vis), null, 2)}\n`
  );
}
