import type { MetadataRoute } from "next";
import { listAisles, listSections } from "@/lib/categoryCatalog";
import { LOOSE_PACK_AISLES, LOOSE_PACK_SECTION } from "@/lib/loosePacks";
import { loadSearchCatalog } from "@/lib/searchCatalog";
import { SITE_URL } from "@/lib/site";
import { PRODUCT_CANONICAL_ALIASES } from "@/lib/seo";
import { loadStoreVisibility } from "@/lib/storeVisibility";

export const revalidate = 43200;

type Entry = { priority: number; changeFrequency: "daily" | "weekly" };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const visibility = await loadStoreVisibility();
  const paths = new Map<string, Entry>([
    ["/", { priority: 1, changeFrequency: "daily" }],
    ["/categories", { priority: 0.6, changeFrequency: "weekly" }],
    ["/visit", { priority: 0.7, changeFrequency: "weekly" }],
    ["/return-policy", { priority: 0.3, changeFrequency: "weekly" }],
  ]);

  for (const section of listSections(visibility)) {
    if (section.hidden) continue;
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

  const catalog = await loadSearchCatalog();
  for (const category of catalog) {
    const key = category.slug === "bakery" || category.slug === "sweets";
    for (const item of category.items) {
      if (!item.id || item.preview_only || item.is_hidden || PRODUCT_CANONICAL_ALIASES[item.id]) continue;
      const path = `/product/${encodeURIComponent(item.id)}`;
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
