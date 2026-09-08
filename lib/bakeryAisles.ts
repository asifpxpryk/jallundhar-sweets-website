import { normalizeName } from "@/lib/sections";
import type { MenuItem } from "@/lib/types";

export const BAKERY_AISLES: { slug: string; name: string; image?: string }[] = [
  { slug: "breads", name: "Breads", image: "/bakery-aisles/breads.webp?v=1" },
  { slug: "biscuits", name: "Biscuits", image: "/bakery-aisles/biscuits.webp?v=1" },
  { slug: "rusks", name: "Rusks", image: "/bakery-aisles/rusks.webp?v=1" },
  { slug: "dry-cakes", name: "Dry Cakes", image: "/bakery-aisles/dry-cakes.webp?v=1" },
  { slug: "cream-cakes", name: "Cream Cakes", image: "/bakery-aisles/cream-cakes.png?v=1" },
  { slug: "pastries", name: "Pastries", image: "/bakery-aisles/pastries.png?v=1" },
];

export type BakeryAisleSlug = (typeof BAKERY_AISLES)[number]["slug"];

export function isBakeryAisle(value: string): boolean {
  return BAKERY_AISLES.some((aisle) => aisle.slug === value);
}

export function getBakeryAisle(slug: string) {
  return BAKERY_AISLES.find((aisle) => aisle.slug === slug) ?? null;
}

export function bakeryAisleForItem(name: string): BakeryAisleSlug | null {
  const n = normalizeName(name);

  if (/\bpastr(y|ies)\b/.test(n)) return "pastries";
  if (/\brusk\b/.test(n)) return "rusks";
  if (/\bdry cake|\bdoller cake|\bdollar cake|\bpound cake|\bcup cake\b/.test(n)) {
    return "dry-cakes";
  }
  if (/\bcream cake|\bbirthday cake|\bevent cake|\bfresh cream|\bicing cake/.test(n)) {
    return "cream-cakes";
  }
  if (/\bbiscuit|\bcookie\b/.test(n)) return "biscuits";
  if (/\bbread\b/.test(n) && !/\bburger\b/.test(n)) return "breads";

  return null;
}

export function filterBakeryAisleItems(items: MenuItem[], slug: string): MenuItem[] {
  if (!isBakeryAisle(slug)) return [];
  return items.filter((item) => bakeryAisleForItem(item.name) === slug);
}

export function bakeryItemsOutsideAisles(items: MenuItem[]): MenuItem[] {
  return items.filter((item) => bakeryAisleForItem(item.name) == null);
}
