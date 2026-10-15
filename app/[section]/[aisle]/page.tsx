import { notFound } from "next/navigation";
import CategoryProducts from "@/components/CategoryProducts";
import { listAisles, listSections } from "@/lib/categoryCatalog";
import { applyMenuOverrides } from "@/lib/loadAisleItems";
import { itemsForPlacement } from "@/lib/itemPlacement";
import { loadAllMenuItemsCached } from "@/lib/loadMenu";
import { loadMenu } from "@/lib/loadMenu";
import { homeShelf, isSectionHidden, loadStoreVisibility } from "@/lib/storeVisibility";
import PromoBannersForPage from "@/components/PromoBannersForPage";
import { bannerOptions } from "@/lib/bannerCatalog";
import { bannerShowsOn } from "@/lib/bannerPlacement";
import { OG_DEFAULTS, aisleSeo } from "@/lib/seo";
import { beveragePreviewItems, tagBeverageItems } from "@/lib/posBeveragePreview";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  const state = { hiddenSections: [], hiddenAisles: [] };
  return listSections(state).flatMap((section) =>
    listAisles(state, section.slug).map((aisle) => ({
      section: section.slug,
      aisle: aisle.slug,
    }))
  );
}

export async function generateMetadata({ params }: { params: { section: string; aisle: string } }) {
  const visibility = await loadStoreVisibility();
  const aisle = listAisles(visibility, params.section).find((entry) => entry.slug === params.aisle);
  const section = listSections(visibility).find((entry) => entry.slug === params.section);
  const canonical = `/${params.section}/${params.aisle}`;
  if (!section || !aisle || aisle.hidden || isSectionHidden(visibility, section.slug)) notFound();
  const seo = aisleSeo(params.section, section?.name ?? params.section, aisle.name);
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical },
    openGraph: { ...OG_DEFAULTS, title: seo.title, description: seo.description, url: canonical },
  };
}

export default async function NestedAislePage({
  params,
}: {
  params: { section: string; aisle: string };
}) {
  const visibility = await loadStoreVisibility();
  const section = listSections(visibility).find((entry) => entry.slug === params.section);
  const aisle = section
    ? listAisles(visibility, section.slug).find((entry) => entry.slug === params.aisle)
    : null;
  if (!section || !aisle) notFound();
  if (isSectionHidden(visibility, section.slug) || aisle.hidden) notFound();

  const hasBanners = bannerOptions(visibility).some((banner) =>
    bannerShowsOn(visibility, banner.id, banner.defaultPage, aisle.href)
  );
  const [overrides, categories] = await Promise.all([
    loadAllMenuItemsCached(),
    hasBanners ? loadMenu() : Promise.resolve([]),
  ]);
  const aisleItems = applyMenuOverrides(
    itemsForPlacement(`${section.slug}:${aisle.slug}`, visibility, overrides),
    overrides,
    false,
    visibility.hiddenItemIds,
    visibility.bestsellerIds,
    homeShelf(visibility)
  );
  const items = section.slug === "beverage"
    ? beveragePreviewItems(tagBeverageItems(aisleItems, aisle.slug), aisle.slug, overrides)
    : aisleItems;
  return (
    <CategoryProducts
      name={aisle.name}
      items={items}
      image={aisle.image}
      extra={hasBanners ? <PromoBannersForPage page={aisle.href} visibility={visibility} categories={categories} /> : undefined}
      hasExtra={false}
      aisleSection={section.slug}
      aisleSlug={aisle.slug}
    />
  );
}
