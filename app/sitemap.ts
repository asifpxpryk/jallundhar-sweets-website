import type { MetadataRoute } from "next";
import { listAisles, listSections } from "@/lib/categoryCatalog";
import { LOOSE_PACK_AISLES, LOOSE_PACK_SECTION } from "@/lib/loosePacks";
import { loadSearchCatalog } from "@/lib/searchCatalog";
import { SITE_URL } from "@/lib/site";
import { PRODUCT_CANONICAL_ALIASES } from "@/lib/seo";
import { loadStoreVisibility } from "@/lib/storeVisibility";
import { loadSlugIndex } from "@/lib/productSlugIndex";
import { loadEmptySectionSlugs } from "@/lib/emptySections";

export const revalidate = 604800;

type Entry = { priority: number; changeFrequency: "daily" | "weekly" };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [visibility, emptySections] = await Promise.all([loadStoreVisibility(), loadEmptySectionSlugs()]);
  const empty = new Set(emptySections);
  const paths = new Map<string, Entry>([
    ["/", { priority: 1, changeFrequency: "daily" }],
    ["/categories", { priority: 0.6, changeFrequency: "weekly" }],
    ["/visit", { priority: 0.7, changeFrequency: "weekly" }],
    ["/live-kitchen", { priority: 0.9, changeFrequency: "daily" }],
    ["/return-policy", { priority: 0.3, changeFrequency: "weekly" }],
  ]);

  for (const section of listSections(visibility)) {
    if (section.hidden || empty.has(section.slug)) continue;
    const key = section.slug === "bakery" || section.slug === "sweets";
    paths.set(section.href, { priority: key ? 0.9 : 0.8, changeFrequency: "daily" });
    for (const aisle of listAisles(visibility, section.slug)) {
      if (aisle.hidden) continue;
      if (!paths.has(aisle.href)) paths.set(aisle.href, { priority: key ? 0.8 : 0.7, changeFrequency: "daily" });
    }
  }

  paths.set(LOOSE_PACK_SECTION.href, { priority: 0.8, changeFrequency: "daily" });
  for (const aisle of LOOSE_PACK_AISLES) {
    paths.set(aisle.href, { priority: 0.7, changeFrequency: "daily" });
  }

  const [catalog, slugs] = await Promise.all([loadSearchCatalog(), loadSlugIndex()]);
  for (const category of catalog) {
    const key = category.slug === "bakery" || category.slug === "sweets";
    for (const item of category.items) {
      if (!item.id || item.preview_only || item.is_hidden || PRODUCT_CANONICAL_ALIASES[item.id]) continue;
      const slug = slugs.byId[item.id];
      if (!slug) continue;
      const path = `/product/${slug}`;
      if (paths.has(path)) continue;
      paths.set(path, { priority: key ? 0.7 : 0.5, changeFrequency: "weekly" });
    }
  }

  return [...paths].map(([path, entry]) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
