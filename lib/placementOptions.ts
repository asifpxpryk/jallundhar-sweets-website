import { SECTIONS, isSectionSlug } from "@/lib/sections";
import { isGeneralAisle } from "@/lib/generalAisles";
import { isBeverageAisle } from "@/lib/beverageAisles";
import { isBakeryAisle } from "@/lib/bakeryAisles";
import { isSweetsAisle } from "@/lib/sweetsAisles";
import {
  isKnownAisle,
  isKnownSection,
  listAisles,
  type CategoryCatalogState,
} from "@/lib/categoryCatalog";

export const SECTION_OPTIONS = SECTIONS.map((section) => ({
  slug: section.slug,
  name: section.name,
}));

export function aislesForSection(
  section: string,
  catalog?: CategoryCatalogState
): { slug: string; name: string }[] {
  if (catalog) {
    return listAisles(catalog, section).map((aisle) => ({ slug: aisle.slug, name: aisle.name }));
  }
  return listAisles({ hiddenSections: [], hiddenAisles: [] }, section).map((aisle) => ({
    slug: aisle.slug,
    name: aisle.name,
  }));
}

export function isValidPlacement(
  section: string,
  aisle: string,
  catalog?: CategoryCatalogState
): boolean {
  if (catalog) {
    if (!isKnownSection(catalog, section)) return false;
    if (!aisle) return true;
    return isKnownAisle(catalog, section, aisle);
  }
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
