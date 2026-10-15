import { notFound } from "next/navigation";
import CategoryProducts from "@/components/CategoryProducts";
import GeneralAisleNav from "@/components/GeneralAisleNav";
import PromoBannersForPage from "@/components/PromoBannersForPage";
import { listSections } from "@/lib/categoryCatalog";
import { loadMenu } from "@/lib/loadMenu";
import { hasCatalogPhoto } from "@/lib/catalogPhoto";
import { countCatalogProducts } from "@/lib/itemPlacement";
import { OG_DEFAULTS, sectionSeo } from "@/lib/seo";
import { isSectionHidden, loadStoreVisibility } from "@/lib/storeVisibility";

export const revalidate = 43200;

const generalSeo = sectionSeo("general", "General");

export const metadata = {
  title: generalSeo.title,
  description: generalSeo.description,
  alternates: { canonical: "/general" },
  openGraph: { ...OG_DEFAULTS, title: generalSeo.title, description: generalSeo.description, url: "/general" },
};

export default async function GeneralPage() {
  const visibility = await loadStoreVisibility();
  if (isSectionHidden(visibility, "general")) notFound();
  const meta = listSections(visibility).find((section) => section.slug === "general");
  const categories = await loadMenu();
  const category = categories.find((c) => c.slug === "general");

  return (
    <CategoryProducts
      name={meta?.name ?? "General"}
      items={category?.items ?? []}
      productCount={
        countCatalogProducts("general", visibility.hiddenItemIds, visibility.hiddenAisles, true) +
        (category?.items.filter((item) => hasCatalogPhoto(item)).length ?? 0)
      }
      image={meta?.image}
      extra={
        <>
          <GeneralAisleNav />
          <PromoBannersForPage page="/general" visibility={visibility} categories={categories} />
        </>
      }
      menuSlug="general"
    />
  );
}
