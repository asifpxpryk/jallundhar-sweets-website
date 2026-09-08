import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import { unstable_cache, revalidateTag } from "next/cache";
import { SECTIONS, isSectionSlug } from "@/lib/sections";
import { GENERAL_AISLES, isGeneralAisle } from "@/lib/generalAisles";
import { BEVERAGE_AISLES, isBeverageAisle } from "@/lib/beverageAisles";
import fallback from "@/data/store-visibility.json";

export type CategoryKind = "section" | "aisle";

export type StoreVisibility = {
  hiddenSections: string[];
  hiddenAisles: string[];
  hiddenItemIds: string[];
};

export const ITEM_VISIBILITY_PREFIX = "item:";

export function itemVisibilitySlug(id: string) {
  return `${ITEM_VISIBILITY_PREFIX}${id}`;
}

type VisibilityRow = {
  kind: CategoryKind;
  slug: string;
  hidden: boolean;
};

function asSet(values: string[]): Set<string> {
  return new Set(values.filter(Boolean));
}

function parseVisibility(raw: unknown): StoreVisibility {
  const data = (raw ?? {}) as Partial<StoreVisibility>;
  return {
    hiddenSections: [...asSet(data.hiddenSections ?? [])],
    hiddenAisles: [...asSet(data.hiddenAisles ?? [])],
    hiddenItemIds: [...asSet(data.hiddenItemIds ?? [])],
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
    if (row.kind === "section" && isSectionSlug(row.slug)) {
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
    if (row.kind === "aisle" && (isGeneralAisle(row.slug) || isBeverageAisle(row.slug))) {
      if (row.hidden) aisles.add(row.slug);
      else aisles.delete(row.slug);
    }
  }
  return {
    hiddenSections: [...sections],
    hiddenAisles: [...aisles],
    hiddenItemIds: [...items],
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

async function loadStoreVisibilityUncached(): Promise<StoreVisibility> {
  const base = await loadFallback();
  const rows = await loadFromSupabase();
  if (!rows) return base;
  return applyRows(base, rows);
}

export const loadStoreVisibility = unstable_cache(
  loadStoreVisibilityUncached,
  ["jallundhar-store-visibility-v2"],
  { revalidate: 60, tags: ["store-visibility"] }
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

export function visibleSections(vis: StoreVisibility) {
  return SECTIONS.filter((section) => !isSectionHidden(vis, section.slug));
}

export function visibleAisles(vis: StoreVisibility) {
  if (isSectionHidden(vis, "general")) return [];
  return GENERAL_AISLES.filter((aisle) => !vis.hiddenAisles.includes(aisle.slug));
}

export function visibleBeverageAisles(vis: StoreVisibility) {
  if (isSectionHidden(vis, "beverage")) return [];
  return BEVERAGE_AISLES.filter((aisle) => !vis.hiddenAisles.includes(aisle.slug));
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
    `${JSON.stringify(
      {
        hiddenSections: vis.hiddenSections,
        hiddenAisles: vis.hiddenAisles,
        hiddenItemIds: vis.hiddenItemIds,
      },
      null,
      2
    )}\n`
  );
}
