import { SECTIONS, isSectionSlug } from "@/lib/sections";
import { GENERAL_AISLES, isGeneralAisle } from "@/lib/generalAisles";
import { BEVERAGE_AISLES, isBeverageAisle } from "@/lib/beverageAisles";
import { BAKERY_AISLES, isBakeryAisle } from "@/lib/bakeryAisles";
import { SWEETS_AISLES, isSweetsAisle } from "@/lib/sweetsAisles";

export const SECTION_OPTIONS = SECTIONS.map((section) => ({
  slug: section.slug,
  name: section.name,
}));

export function aislesForSection(section: string): { slug: string; name: string }[] {
  if (section === "general") return GENERAL_AISLES.map((aisle) => ({ slug: aisle.slug, name: aisle.name }));
  if (section === "beverage") return BEVERAGE_AISLES.map((aisle) => ({ slug: aisle.slug, name: aisle.name }));
  if (section === "bakery") return BAKERY_AISLES.map((aisle) => ({ slug: aisle.slug, name: aisle.name }));
  if (section === "sweets") return SWEETS_AISLES.map((aisle) => ({ slug: aisle.slug, name: aisle.name }));
  return [];
}

export function isValidPlacement(section: string, aisle: string): boolean {
  if (!isSectionSlug(section)) return false;
  if (!aisle) return true;
  if (section === "general") return isGeneralAisle(aisle);
  if (section === "beverage") return isBeverageAisle(aisle);
  if (section === "bakery") return isBakeryAisle(aisle);
  if (section === "sweets") return isSweetsAisle(aisle);
  return false;
}

export function placementKey(section: string, aisle: string): string {
  return aisle ? `${section}:${aisle}` : section;
}

export function parsePlacement(key: string | undefined): { section: string; aisle: string } {
  if (!key) return { section: "sweets", aisle: "" };
  const [section, aisle = ""] = key.split(":");
  return { section, aisle };
}
