import { notFound } from "next/navigation";
import CategoryProducts from "@/components/CategoryProducts";
import { listAisles, listSections } from "@/lib/categoryCatalog";
import { loadAllMenuItemsCached, loadMenu } from "@/lib/loadMenu";
import BeverageAisleNav from "@/components/BeverageAisleNav";
import BakeryAisleNav from "@/components/BakeryAisleNav";
import SweetsAisleNav from "@/components/SweetsAisleNav";
import SectionAisleNav from "@/components/SectionAisleNav";
import PromoBannersForPage from "@/components/PromoBannersForPage";
import { homeShelf, loadStoreVisibility } from "@/lib/storeVisibility";
import { itemsForPlacement } from "@/lib/itemPlacement";
import { applyMenuOverrides } from "@/lib/loadAisleItems";
import { OG_DEFAULTS, sectionSeo } from "@/lib/seo";
import { beverageAisleCatalogItems, beveragePreviewItems, tagBeverageItems } from "@/lib/posBeveragePreview";

export const revalidate = 43200;
export const dynamicParams = true;

export function generateStaticParams() {
  return listSections({ hiddenSections: [], hiddenAisles: [] }).map((section) => ({
    section: section.slug,
  }));
}

export async function generateMetadata({ params }: { params: { section: string } }) {
  const visibility = await loadStoreVisibility();
  const meta = listSections(visibility).find((section) => section.slug === params.section);
  if (!meta || meta.hidden) notFound();
  const seo = sectionSeo(meta.slug, meta.name);
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/${params.section}` },
    openGraph: { ...OG_DEFAULTS, title: seo.title, description: seo.description, url: `/${params.section}` },
  };
}

export default async function SectionPage({ params }: { params: { section: string } }) {
  const visibility = await loadStoreVisibility();
  const meta = listSections(visibility).find((section) => section.slug === params.section);
  if (!meta) notFound();
  if (meta.hidden) notFound();

  const [categories, overrides] = await Promise.all([
    loadMenu(),
    meta.slug === "sweets" || meta.slug === "bakery"
      ? Promise.resolve([])
      : loadAllMenuItemsCached(),
  ]);
  const category = categories.find((entry) => entry.slug === meta.slug);
  const sectionItems =
    meta.slug === "sweets" || meta.slug === "bakery"
      ? []
      : meta.slug === "beverage"
      ? category?.items ?? []
      : applyMenuOverrides(
          itemsForPlacement(meta.slug, visibility, category?.items ?? []),
          overrides,
          false,
          visibility.hiddenItemIds,
          visibility.bestsellerIds,
          homeShelf(visibility)
        );
  const items = meta.slug === "beverage"
    ? beveragePreviewItems(
        tagBeverageItems([...beverageAisleCatalogItems(), ...sectionItems]),
        undefined,
        [...overrides, ...beverageAisleCatalogItems()]
      )
    : sectionItems;
  const visibleAisleCount = listAisles(visibility, meta.slug).filter((aisle) => !aisle.hidden).length;

  return (
    <CategoryProducts
      name={meta.name}
      items={items}
      productCount={items.length > 0 ? items.length : category?.items.length ?? 0}
      image={meta.image}
      hasExtra={visibleAisleCount > 0 || meta.slug === "beverage" || meta.slug === "sweets"}
      extra={
        <>
          {meta.slug === "beverage" ? (
            <BeverageAisleNav />
          ) : meta.slug === "bakery" ? (
            <BakeryAisleNav />
          ) : meta.slug === "sweets" ? (
            <SweetsAisleNav />
          ) : (
            <SectionAisleNav section={meta.slug} />
          )}
          <PromoBannersForPage page={meta.href} visibility={visibility} categories={categories} />
        </>
      }
      menuSlug={meta.slug}
      aisleSection={meta.slug}
    />
  );
}
