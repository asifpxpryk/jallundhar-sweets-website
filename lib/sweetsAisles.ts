import { normalizeName } from "@/lib/sections";
import type { MenuItem } from "@/lib/types";

export const SWEETS_AISLES: { slug: string; name: string; image?: string }[] = [
  { slug: "special", name: "Special", image: "/sweets-aisles/special.webp?v=1" },
  { slug: "seasonal", name: "Seasonal", image: "/sweets-aisles/seasonal.webp?v=1" },
  { slug: "sugarfree", name: "Sugarfree", image: "/sweets-aisles/sugarfree.webp?v=1" },
  { slug: "traditional", name: "Traditional", image: "/sweets-aisles/traditional.webp?v=1" },
];

export type SweetsAisleSlug = (typeof SWEETS_AISLES)[number]["slug"];

export function isSweetsAisle(value: string): boolean {
  return SWEETS_AISLES.some((aisle) => aisle.slug === value);
}

export function getSweetsAisle(slug: string) {
  return SWEETS_AISLES.find((aisle) => aisle.slug === slug) ?? null;
}

export function sweetsAisleForItem(name: string): SweetsAisleSlug {
  const n = normalizeName(name);

  if (/\bsugar\s*free\b|\bsugarfree\b|\bdiabetic\b|\bno sugar\b/.test(n)) {
    return "sugarfree";
  }
  if (
    /\bseasonal\b|\beid\b|\bramzan\b|\bramadan\b|\bdiwali\b|\bbasant\b|\bgajar\b|\brewri\b|\breori\b|\bgajak\b|\bfalsa\b/.test(
      n
    )
  ) {
    return "seasonal";
  }
  if (/\bspecial\b|\barabic sweets\b|\basghar shahi\b/.test(n)) {
    return "special";
  }
  return "traditional";
}

export function filterSweetsAisleItems(items: MenuItem[], slug: string): MenuItem[] {
  if (!isSweetsAisle(slug)) return [];
  return items.filter((item) => sweetsAisleForItem(item.name) === slug);
}
