import { notFound } from "next/navigation";
import CategoryProducts from "@/components/CategoryProducts";
import { SECTIONS, isSectionSlug } from "@/lib/sections";
import { loadMenu } from "@/lib/loadMenu";
import GeneralAisleNav from "@/components/GeneralAisleNav";
import BeverageAisleNav from "@/components/BeverageAisleNav";
import { isSectionHidden, loadStoreVisibility } from "@/lib/storeVisibility";

export const revalidate = 60;
export const dynamicParams = true;

export function generateStaticParams() {
  return SECTIONS.map((section) => ({ section: section.slug }));
}

export function generateMetadata({ params }: { params: { section: string } }) {
  const meta = SECTIONS.find((s) => s.slug === params.section);
  return {
    title: meta
      ? `${meta.name} | Jallundhar Sweets & Bakers`
      : "Jallundhar Sweets & Bakers",
  };
}

export default async function SectionPage({ params }: { params: { section: string } }) {
  if (!isSectionSlug(params.section)) notFound();
  const visibility = await loadStoreVisibility();
  if (isSectionHidden(visibility, params.section)) notFound();
  const meta = SECTIONS.find((s) => s.slug === params.section)!;
  const categories = await loadMenu();
  const category = categories.find((c) => c.slug === meta.slug);

  return (
    <CategoryProducts
      name={meta.name}
      items={category?.items ?? []}
      image={meta.image}
      extra={
        meta.slug === "general" ? (
          <GeneralAisleNav />
        ) : meta.slug === "beverage" ? (
          <BeverageAisleNav />
        ) : undefined
      }
      menuSlug={meta.slug}
    />
  );
}
