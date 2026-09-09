import { notFound } from "next/navigation";
import CategoryProducts from "@/components/CategoryProducts";
import { GENERAL_AISLES, getGeneralAisle, isGeneralAisle } from "@/lib/generalAisles";
import { BEVERAGE_AISLES, getBeverageAisle, isBeverageAisle } from "@/lib/beverageAisles";
import { BAKERY_AISLES, getBakeryAisle, isBakeryAisle } from "@/lib/bakeryAisles";
import { SWEETS_AISLES, getSweetsAisle, isSweetsAisle } from "@/lib/sweetsAisles";
import { applyMenuOverrides } from "@/lib/loadAisleItems";
import { itemsForPlacement } from "@/lib/itemPlacement";
import { loadAllMenuItems } from "@/lib/loadMenu";
import {
  isAisleHidden,
  isBakeryAisleHidden,
  isBeverageAisleHidden,
  isSweetsAisleHidden,
  loadStoreVisibility,
} from "@/lib/storeVisibility";

export const revalidate = 60;
export const dynamicParams = true;

export function generateStaticParams() {
  return [
    ...GENERAL_AISLES.map((aisle) => ({ section: "general", aisle: aisle.slug })),
    ...BEVERAGE_AISLES.map((aisle) => ({ section: "beverage", aisle: aisle.slug })),
    ...BAKERY_AISLES.map((aisle) => ({ section: "bakery", aisle: aisle.slug })),
    ...SWEETS_AISLES.map((aisle) => ({ section: "sweets", aisle: aisle.slug })),
  ];
}

export function generateMetadata({ params }: { params: { section: string; aisle: string } }) {
  if (params.section === "general") {
    const aisle = getGeneralAisle(params.aisle);
    return {
      title: aisle
        ? `${aisle.name} | Jallundhar Sweets & Bakers`
        : "Jallundhar Sweets & Bakers",
      alternates: { canonical: `/general/${params.aisle}` },
    };
  }
  if (params.section === "beverage") {
    const aisle = getBeverageAisle(params.aisle);
    return {
      title: aisle
        ? `${aisle.name} | Jallundhar Sweets & Bakers`
        : "Jallundhar Sweets & Bakers",
      alternates: { canonical: `/beverage/${params.aisle}` },
    };
  }
  if (params.section === "bakery") {
    const aisle = getBakeryAisle(params.aisle);
    return {
      title: aisle
        ? `${aisle.name} | Jallundhar Sweets & Bakers`
        : "Jallundhar Sweets & Bakers",
      alternates: { canonical: `/bakery/${params.aisle}` },
    };
  }
  if (params.section === "sweets") {
    const aisle = getSweetsAisle(params.aisle);
    return {
      title: aisle
        ? `${aisle.name} | Jallundhar Sweets & Bakers`
        : "Jallundhar Sweets & Bakers",
      alternates: { canonical: `/sweets/${params.aisle}` },
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
  const overrides = await loadAllMenuItems();

  if (params.section === "general" && isGeneralAisle(params.aisle)) {
    if (isAisleHidden(visibility, params.aisle)) notFound();
    const aisle = getGeneralAisle(params.aisle)!;
    return (
      <CategoryProducts
        name={aisle.name}
        items={applyMenuOverrides(
          itemsForPlacement(`general:${aisle.slug}`, visibility, overrides),
          overrides,
          false,
          visibility.hiddenItemIds,
          visibility.bestsellerIds
        )}
        image={aisle.image}
        aisleSection="general"
        aisleSlug={aisle.slug}
      />
    );
  }

  if (params.section === "beverage" && isBeverageAisle(params.aisle)) {
    if (isBeverageAisleHidden(visibility, params.aisle)) notFound();
    const aisle = getBeverageAisle(params.aisle)!;
    return (
      <CategoryProducts
        name={aisle.name}
        items={applyMenuOverrides(
          itemsForPlacement(`beverage:${aisle.slug}`, visibility, overrides),
          overrides,
          false,
          visibility.hiddenItemIds,
          visibility.bestsellerIds
        )}
        image={aisle.image}
        aisleSection="beverage"
        aisleSlug={aisle.slug}
      />
    );
  }

  if (params.section === "bakery" && isBakeryAisle(params.aisle)) {
    if (isBakeryAisleHidden(visibility, params.aisle)) notFound();
    const aisle = getBakeryAisle(params.aisle)!;
    return (
      <CategoryProducts
        name={aisle.name}
        items={applyMenuOverrides(
          itemsForPlacement(`bakery:${aisle.slug}`, visibility, overrides),
          overrides,
          false,
          visibility.hiddenItemIds,
          visibility.bestsellerIds
        )}
        image={aisle.image}
        aisleSection="bakery"
        aisleSlug={aisle.slug}
      />
    );
  }

  if (params.section === "sweets" && isSweetsAisle(params.aisle)) {
    if (isSweetsAisleHidden(visibility, params.aisle)) notFound();
    const aisle = getSweetsAisle(params.aisle)!;
    return (
      <CategoryProducts
        name={aisle.name}
        items={applyMenuOverrides(
          itemsForPlacement(`sweets:${aisle.slug}`, visibility, overrides),
          overrides,
          false,
          visibility.hiddenItemIds,
          visibility.bestsellerIds
        )}
        image={aisle.image}
        aisleSection="sweets"
        aisleSlug={aisle.slug}
      />
    );
  }

  notFound();
}
