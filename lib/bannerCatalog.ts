import { beverageHighlights } from "@/components/BeveragePromoBanners";
import { generalHighlights } from "@/components/GeneralPromoBanners";
import { listAisles, listSections } from "@/lib/categoryCatalog";
import type { StoreVisibility } from "@/lib/storeVisibility";
import { bannerId } from "@/lib/bannerPlacement";

export type BannerOption = {
  id: string;
  title: string;
  source: string;
  defaultPage: string;
  image: string;
};

export type BannerPageOption = {
  path: string;
  label: string;
  hidden: boolean;
};

export function bannerOptions(visibility: StoreVisibility): BannerOption[] {
  const sweets: BannerOption[] = [
    ["Special Sweets", "/products/4629.webp"],
    ["Traditional Mithai", "/products/4620.webp"],
    ["Seasonal Sweets", "/sweets-aisles/seasonal.webp"],
    ["Sugarfree Sweets", "/sweets-aisles/sugarfree.webp"],
    ["Akhroti Sohan Halwa", "/products/4661.webp"],
  ].map(([title, image]) => ({ id: bannerId("sweets", title), title, source: "Sweets", defaultPage: "/sweets", image }));

  const bakery: BannerOption[] = [
    ["Birthday & Special Cakes", "/bakery-aisles/cream-cakes.png"],
    ["Pastries", "/bakery-aisles/pastries.png"],
    ["Dry Cakes", "/products/4686.webp"],
    ["Biscuits", "/bakery-aisles/biscuits.webp"],
    ["Breads", "/products/4740.webp"],
  ].map(([title, image]) => ({ id: bannerId("bakery", title), title, source: "Bakery", defaultPage: "/bakery", image }));

  const general: BannerOption[] = listAisles(visibility, "general").flatMap((aisle) =>
    (generalHighlights[aisle.slug] ?? []).map((banner) => ({
      id: bannerId("general", banner.title, aisle.slug),
      title: banner.title,
      source: `General / ${aisle.name}`,
      defaultPage: "/general",
      image: banner.image,
    }))
  );

  const beverage: BannerOption[] = listAisles(visibility, "beverage").flatMap((aisle) =>
    (beverageHighlights[aisle.slug] ?? []).map((banner) => ({
      id: bannerId("beverage", banner.title, aisle.slug),
      title: banner.title,
      source: `Beverage / ${aisle.name}`,
      defaultPage: "/beverage",
      image: banner.image,
    }))
  );

  return [...sweets, ...bakery, ...general, ...beverage];
}

export function bannerPageOptions(visibility: StoreVisibility): BannerPageOption[] {
  return [
    { path: "/", label: "Home", hidden: false },
    ...listSections(visibility).flatMap((section) => [
      { path: section.href, label: section.name, hidden: section.hidden },
      ...listAisles(visibility, section.slug).map((aisle) => ({
        path: aisle.href,
        label: `${section.name} / ${aisle.name}`,
        hidden: section.hidden || aisle.hidden,
      })),
    ]),
  ];
}
