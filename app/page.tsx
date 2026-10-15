import Hero from "@/components/Hero";
import CategoryNav from "@/components/CategoryNav";
import BestsellerScroller from "@/components/BestsellerScroller";
import GiftPromoCard from "@/components/GiftPromoCard";
import GheePromoBanner from "@/components/GheePromoBanner";
import WaterPromoBanner from "@/components/WaterPromoBanner";
import PromoBannersForPage from "@/components/PromoBannersForPage";
import ShopExteriorBanner from "@/components/ShopExteriorBanner";
import HomeIntro from "@/components/HomeIntro";
import CustomCakesSection from "@/components/CustomCakesSection";
import LoosePacksHomeBanner from "@/components/LoosePacksHomeBanner";
import { DEFAULT_SHOP_EXTERIOR_TEXT } from "@/lib/shopExteriorBanner";
import { loadMenu } from "@/lib/loadMenu";
import { loadSearchCatalog } from "@/lib/searchCatalog";
import { loadStoreVisibility } from "@/lib/storeVisibility";
import { hasCatalogPhoto } from "@/lib/catalogPhoto";
import type { MenuCategory, MenuItem } from "@/lib/types";

export const revalidate = 43200;

export const metadata = {
  alternates: { canonical: "/" },
};

function takeUnique(
  rows: { item: MenuItem; slug: string }[],
  cap: number,
  picked: { item: MenuItem; slug: string }[],
  seenNames: Set<string>
) {
  const imaged = rows.filter((row) => row.item.image_url);
  const plain = rows.filter((row) => !row.item.image_url);
  for (const row of [...imaged, ...plain]) {
    if (picked.length >= cap) return;
    const key = row.item.name.toLowerCase().replace(/\s+/g, " ").trim();
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    picked.push(row);
  }
}

function pickBestsellers(categories: MenuCategory[]): { items: MenuItem[]; href: string } {
  const flagged = categories.flatMap((category) =>
    category.items
      .filter((item) => item.is_bestseller && !item.preview_only && !item.is_hidden && item.is_available !== false)
      .map((item) => ({ item, slug: category.slug }))
  );
  const bySlug = new Map<string, { item: MenuItem; slug: string }[]>();
  for (const row of flagged) {
    const list = bySlug.get(row.slug) ?? [];
    list.push(row);
    bySlug.set(row.slug, list);
  }
  const groups = [...bySlug.entries()].sort((a, b) => b[1].length - a[1].length);
  const picked: { item: MenuItem; slug: string }[] = [];
  const seenNames = new Set<string>();
  takeUnique(
    flagged.filter((row) => row.slug === "sweets"),
    4,
    picked,
    seenNames
  );
  const bakery = flagged.filter((row) => row.slug === "bakery");
  const cakes = bakery.filter((row) => /cake/i.test(row.item.name));
  const otherBakery = bakery.filter((row) => !/cake/i.test(row.item.name));
  takeUnique([...cakes, ...otherBakery], 12, picked, seenNames);
  for (const [, rows] of groups) {
    const slug = rows[0]?.slug;
    if (slug === "sweets" || slug === "bakery") continue;
    takeUnique(rows, 12, picked, seenNames);
    if (picked.length >= 12) break;
  }
  const pickedSlugs = new Set(picked.map((row) => row.slug));
  const href = pickedSlugs.size === 1 ? `/${picked[0].slug}` : "/categories";
  return { items: picked.map((row) => row.item), href };
}

function shelfName(name: string) {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

function pickFlaggedShelf(
  categories: MenuCategory[],
  flag: (item: MenuItem) => boolean,
  excludeIds: Set<string>,
  excludeNames: Set<string>,
  cap: number
): { items: MenuItem[]; href: string } {
  const buckets = new Map<string, { item: MenuItem; slug: string }[]>([
    ["sweets", []],
    ["bakery", []],
    ["general", []],
    ["other", []],
  ]);
  for (const category of categories) {
    const key = buckets.has(category.slug) ? category.slug : "other";
    for (const item of category.items) {
      if (!flag(item) || item.preview_only || item.is_hidden) continue;
      if (!hasCatalogPhoto(item) || excludeIds.has(item.id)) continue;
      if (excludeNames.has(shelfName(item.name))) continue;
      buckets.get(key)?.push({ item, slug: category.slug });
    }
  }
  const picked: { item: MenuItem; slug: string }[] = [];
  const seen = new Set<string>();
  const queues = ["sweets", "bakery", "general", "other"].map((key) => buckets.get(key) ?? []);
  while (picked.length < cap && queues.some((queue) => queue.length > 0)) {
    for (const queue of queues) {
      let row = queue.shift();
      while (row && seen.has(shelfName(row.item.name))) row = queue.shift();
      if (!row) continue;
      seen.add(shelfName(row.item.name));
      picked.push(row);
      if (picked.length >= cap) break;
    }
  }
  const counts = new Map<string, number>();
  for (const row of picked) counts.set(row.slug, (counts.get(row.slug) ?? 0) + 1);
  let href = "/categories";
  let best = 0;
  for (const [slug, count] of counts) {
    if (count > best) {
      best = count;
      href = `/${slug}`;
    }
  }
  return { items: picked.map((row) => row.item), href };
}

export default async function Home() {
  const [categories, visibility, catalog] = await Promise.all([
    loadMenu(),
    loadStoreVisibility(),
    loadSearchCatalog(),
  ]);
  const bestsellers = pickBestsellers(catalog);
  const bestsellerIds = new Set(bestsellers.items.map((item) => item.id));
  const bestsellerNames = new Set(bestsellers.items.map((item) => shelfName(item.name)));
  const deals = pickFlaggedShelf(
    catalog,
    (item) => Boolean(item.is_deal),
    bestsellerIds,
    bestsellerNames,
    8
  );
  const usedIds = new Set([...bestsellerIds, ...deals.items.map((item) => item.id)]);
  const usedNames = new Set([...bestsellerNames, ...deals.items.map((item) => shelfName(item.name))]);
  const arrivals = pickFlaggedShelf(
    catalog,
    (item) => Boolean(item.is_new_arrival),
    usedIds,
    usedNames,
    12
  );

  return (
    <>
      <Hero />
      <CategoryNav rise />
      <CustomCakesSection />
      <div className="home-reveal">
        <BestsellerScroller items={bestsellers.items} viewAllHref={bestsellers.href} />
        <BestsellerScroller title="New Arrivals" tone="new" items={arrivals.items} viewAllHref={arrivals.href} />
        <BestsellerScroller title="Website Special Deals" tone="deal" items={deals.items} viewAllHref={deals.href} />
      </div>
      <LoosePacksHomeBanner />
      <div className="home-reveal">
        <ShopExteriorBanner text={visibility.shopExteriorText ?? DEFAULT_SHOP_EXTERIOR_TEXT} />
      </div>
      <div className="home-reveal">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 pb-6 sm:grid-cols-2 sm:px-6">
          <PromoBannersForPage page="/" visibility={visibility} categories={categories} compact />
        </div>
        <GiftPromoCard />
        <div className="mx-auto max-w-6xl space-y-6 px-4 pb-6 sm:px-6">
          <GheePromoBanner />
          <WaterPromoBanner />
        </div>
      </div>
      <HomeIntro />
    </>
  );
}
