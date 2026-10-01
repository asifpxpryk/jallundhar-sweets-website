import { notFound } from "next/navigation";
import CategoryProducts from "@/components/CategoryProducts";
import { listAisles, listSections } from "@/lib/categoryCatalog";
import { loadAllMenuItems, loadMenu } from "@/lib/loadMenu";
import BeverageAisleNav from "@/components/BeverageAisleNav";
import BakeryAisleNav from "@/components/BakeryAisleNav";
import SweetsAisleNav from "@/components/SweetsAisleNav";
import SectionAisleNav from "@/components/SectionAisleNav";
import PromoBannersForPage from "@/components/PromoBannersForPage";
import { loadStoreVisibility } from "@/lib/storeVisibility";
import { effectivePlacementKey } from "@/lib/itemPlacement";
import { beveragePreviewItems, tagBeverageItems } from "@/lib/posBeveragePreview";

export const revalidate = 60;
export const dynamicParams = true;

export function generateStaticParams() {
  return listSections({ hiddenSections: [], hiddenAisles: [] }).map((section) => ({
    section: section.slug,
  }));
}

export async function generateMetadata({ params }: { params: { section: string } }) {
  const visibility = await loadStoreVisibility();
  const meta = listSections(visibility).find((section) => section.slug === params.section);
  return {
    title: meta ? `${meta.name} | Jallundhar Sweets & Bakers` : "Jallundhar Sweets & Bakers",
    alternates: { canonical: `/${params.section}` },
  };
}

export default async function SectionPage({ params }: { params: { section: string } }) {
  const visibility = await loadStoreVisibility();
  const meta = listSections(visibility).find((section) => section.slug === params.section);
  if (!meta) notFound();
  if (meta.hidden) notFound();

  const [categories, knownProducts] = await Promise.all([
    loadMenu(),
    meta.slug === "beverage" ? loadAllMenuItems() : Promise.resolve([]),
  ]);
  const category = categories.find((entry) => entry.slug === meta.slug);
  const sectionItems =
    meta.slug === "sweets" || meta.slug === "bakery"
      ? []
      : meta.slug === "beverage"
      ? category?.items ?? []
      : (category?.items ?? []).filter(
          (item) => effectivePlacementKey(item, visibility) === meta.slug
        );
  const items = meta.slug === "beverage"
    ? beveragePreviewItems(tagBeverageItems(sectionItems), undefined, knownProducts)
    : sectionItems;
  const visibleAisleCount = listAisles(visibility, meta.slug).filter((aisle) => !aisle.hidden).length;

  return (
    <CategoryProducts
      name={meta.name}
      items={items}
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
    />
  );
}
