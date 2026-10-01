import { BAKERY_AISLES } from "@/lib/bakeryAisles";
import { BEVERAGE_AISLES } from "@/lib/beverageAisles";
import { GENERAL_AISLES } from "@/lib/generalAisles";
import { SECTIONS } from "@/lib/sections";
import { SWEETS_AISLES } from "@/lib/sweetsAisles";

export type CategoryKind = "section" | "aisle";

export type CustomCategory = {
  kind: CategoryKind;
  slug: string;
  name: string;
  parent: string;
  image?: string;
};

export type CategoryCatalogState = {
  hiddenSections: string[];
  hiddenAisles: string[];
  categoryNames?: Record<string, string>;
  categoryImages?: Record<string, string>;
  customCategories?: CustomCategory[];
};

export type CatalogEntry = {
  kind: CategoryKind;
  slug: string;
  name: string;
  parent: string;
  image?: string;
  emoji?: string;
  hidden: boolean;
  custom: boolean;
  href: string;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED_SECTIONS = new Set(["account", "admin", "api", "categories"]);

export function isCategorySlug(value: string) {
  return SLUG_RE.test(value) && value.length <= 48;
}

export function categoryKey(kind: CategoryKind, slug: string, parent = "") {
  return kind === "section" ? `section:${slug}` : `aisle:${parent}:${slug}`;
}

export function slugifyCategoryName(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function parseCustomCategories(raw: unknown): CustomCategory[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomCategory[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const item = row as Partial<CustomCategory>;
    const kind = item.kind === "aisle" || item.kind === "section" ? item.kind : null;
    const slug = typeof item.slug === "string" ? item.slug.trim() : "";
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const parent = typeof item.parent === "string" ? item.parent.trim() : "";
    const image = typeof item.image === "string" && item.image.trim() ? item.image.trim() : undefined;
    if (!kind || !isCategorySlug(slug) || !name) continue;
    if (kind === "section" && parent) continue;
    if (kind === "aisle" && !isCategorySlug(parent)) continue;
    out.push({ kind, slug, name, parent: kind === "section" ? "" : parent, image });
  }
  return out;
}

export function parseCategoryMap(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key || typeof value !== "string") continue;
    const text = value.trim().slice(0, 60);
    if (text) out[key] = text;
  }
  return out;
}

export function parseCategoryImages(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!key || typeof value !== "string") continue;
    const text = value.trim();
    if (!text || text.length > 2000) continue;
    if (!/^https?:\/\//i.test(text) && !text.startsWith("/")) continue;
    out[key] = text;
  }
  return out;
}

function builtinAisles(section: string) {
  if (section === "general") return GENERAL_AISLES;
  if (section === "beverage") return BEVERAGE_AISLES;
  if (section === "bakery") return BAKERY_AISLES;
  if (section === "sweets") return SWEETS_AISLES;
  return [];
}

function displayName(
  state: CategoryCatalogState,
  kind: CategoryKind,
  slug: string,
  parent: string,
  fallback: string
) {
  return state.categoryNames?.[categoryKey(kind, slug, parent)] || fallback;
}

function displayImage(
  state: CategoryCatalogState,
  kind: CategoryKind,
  slug: string,
  parent: string,
  fallback?: string
) {
  return state.categoryImages?.[categoryKey(kind, slug, parent)] || fallback;
}

export function listSections(state: CategoryCatalogState): CatalogEntry[] {
  const hidden = new Set(state.hiddenSections);
  const builtins: CatalogEntry[] = SECTIONS.map((section) => ({
    kind: "section",
    slug: section.slug,
    name: displayName(state, "section", section.slug, "", section.name),
    parent: "",
    image: displayImage(state, "section", section.slug, "", section.image),
    emoji: section.emoji,
    hidden: hidden.has(section.slug),
    custom: false,
    href: `/${section.slug}`,
  }));
  const taken = new Set(builtins.map((section) => section.slug));
  const extras: CatalogEntry[] = (state.customCategories ?? [])
    .filter((category) => category.kind === "section" && !taken.has(category.slug))
    .map((category) => ({
      kind: "section",
      slug: category.slug,
      name: displayName(state, "section", category.slug, "", category.name),
      parent: "",
      image: displayImage(state, "section", category.slug, "", category.image),
      hidden: hidden.has(category.slug),
      custom: true,
      href: `/${category.slug}`,
    }));
  return [...builtins, ...extras];
}

export function listAisles(state: CategoryCatalogState, section: string): CatalogEntry[] {
  const hidden = new Set(state.hiddenAisles);
  const builtins: CatalogEntry[] = builtinAisles(section).map((aisle) => ({
    kind: "aisle",
    slug: aisle.slug,
    name: displayName(state, "aisle", aisle.slug, section, aisle.name),
    parent: section,
    image: displayImage(state, "aisle", aisle.slug, section, aisle.image),
    hidden: hidden.has(aisle.slug),
    custom: false,
    href: `/${section}/${aisle.slug}`,
  }));
  const taken = new Set(builtins.map((aisle) => aisle.slug));
  const extras: CatalogEntry[] = (state.customCategories ?? [])
    .filter((category) => category.kind === "aisle" && category.parent === section && !taken.has(category.slug))
    .map((category) => ({
      kind: "aisle",
      slug: category.slug,
      name: displayName(state, "aisle", category.slug, section, category.name),
      parent: section,
      image: displayImage(state, "aisle", category.slug, section, category.image),
      hidden: hidden.has(category.slug),
      custom: true,
      href: `/${section}/${category.slug}`,
    }));
  return [...builtins, ...extras];
}

export function isKnownSection(state: CategoryCatalogState, slug: string) {
  return listSections(state).some((section) => section.slug === slug);
}

export function isKnownAisle(state: CategoryCatalogState, section: string, slug: string) {
  return listAisles(state, section).some((aisle) => aisle.slug === slug);
}

export function aisleSlugTaken(state: CategoryCatalogState, slug: string) {
  return listSections(state).some((section) =>
    listAisles(state, section.slug).some((aisle) => aisle.slug === slug)
  );
}

export function isReservedSectionSlug(slug: string) {
  return RESERVED_SECTIONS.has(slug);
}

export function uniqueCategorySlug(name: string, taken: Set<string>) {
  const base = slugifyCategoryName(name);
  if (!base || !isCategorySlug(base)) return "";
  if (!taken.has(base)) return base;
  for (let index = 2; index < 50; index += 1) {
    const next = `${base}-${index}`.slice(0, 48);
    if (isCategorySlug(next) && !taken.has(next)) return next;
  }
  return "";
}
