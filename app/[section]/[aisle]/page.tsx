import { notFound } from "next/navigation";
import CategoryProducts from "@/components/CategoryProducts";
import { GENERAL_AISLES, getGeneralAisle, isGeneralAisle } from "@/lib/generalAisles";
import { BEVERAGE_AISLES, getBeverageAisle, isBeverageAisle } from "@/lib/beverageAisles";
import { loadAisleItems, applyMenuOverrides } from "@/lib/loadAisleItems";
import { isAisleHidden, isBeverageAisleHidden, loadStoreVisibility } from "@/lib/storeVisibility";
import { loadMenu } from "@/lib/loadMenu";

export const revalidate = 60;
export const dynamicParams = true;

export function generateStaticParams() {
  return [
    ...GENERAL_AISLES.map((aisle) => ({ section: "general", aisle: aisle.slug })),
    ...BEVERAGE_AISLES.map((aisle) => ({ section: "beverage", aisle: aisle.slug })),
  ];
}

export function generateMetadata({ params }: { params: { section: string; aisle: string } }) {
  if (params.section === "general") {
    const aisle = getGeneralAisle(params.aisle);
    return {
      title: aisle
        ? `${aisle.name} | Jallundhar Sweets & Bakers`
        : "Jallundhar Sweets & Bakers",
    };
  }
  if (params.section === "beverage") {
    const aisle = getBeverageAisle(params.aisle);
    return {
      title: aisle
        ? `${aisle.name} | Jallundhar Sweets & Bakers`
        : "Jallundhar Sweets & Bakers",
    };
  }
  return { title: "Jallundhar Sweets & Bakers" };
}

export default async function NestedAislePage({
  params,
}: {
  params: { section: string; aisle: string };
}) {
  const visibility = await loadStoreVisibility();
  const overrides = (await loadMenu()).flatMap((category) => category.items);

  if (params.section === "general" && isGeneralAisle(params.aisle)) {
    if (isAisleHidden(visibility, params.aisle)) notFound();
    const aisle = getGeneralAisle(params.aisle)!;
    return (
      <CategoryProducts
        name={aisle.name}
        items={applyMenuOverrides(loadAisleItems(aisle.slug), overrides, false)}
        image={aisle.image}
      />
    );
  }

  if (params.section === "beverage" && isBeverageAisle(params.aisle)) {
    if (isBeverageAisleHidden(visibility, params.aisle)) notFound();
    const aisle = getBeverageAisle(params.aisle)!;
    return (
      <CategoryProducts
        name={aisle.name}
        items={applyMenuOverrides(loadAisleItems(`beverage:${aisle.slug}`), overrides, false)}
        image={aisle.image}
      />
    );
  }

  notFound();
}
