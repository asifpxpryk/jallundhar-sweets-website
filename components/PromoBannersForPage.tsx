import BakeryPromoBanners from "@/components/BakeryPromoBanners";
import BeveragePromoBanners from "@/components/BeveragePromoBanners";
import GeneralPromoBanners from "@/components/GeneralPromoBanners";
import SweetsPromoBanners from "@/components/SweetsPromoBanners";
import { listAisles } from "@/lib/categoryCatalog";
import type { StoreVisibility } from "@/lib/storeVisibility";
import type { MenuCategory } from "@/lib/types";

export default function PromoBannersForPage({
  page,
  visibility,
  categories,
  compact = false,
}: {
  page: string;
  visibility: StoreVisibility;
  categories: MenuCategory[];
  compact?: boolean;
}) {
  const sweetsItems = categories.find((category) => category.slug === "sweets")?.items ?? [];
  const bakeryItems = categories.find((category) => category.slug === "bakery")?.items ?? [];
  const groups = {
    sweets: <SweetsPromoBanners items={sweetsItems} visibility={visibility} page={page} compact={compact} />,
    bakery: <BakeryPromoBanners items={bakeryItems} visibility={visibility} page={page} compact={compact} />,
    general: <GeneralPromoBanners aisles={listAisles(visibility, "general")} visibility={visibility} page={page} compact={compact} />,
    beverage: <BeveragePromoBanners aisles={listAisles(visibility, "beverage")} visibility={visibility} page={page} compact={compact} />,
  };
  const primary = page.split("/")[1];
  const order = ([primary, "sweets", "bakery", "general", "beverage"] as const).filter(
    (group, index, all) => group in groups && all.indexOf(group) === index
  ) as (keyof typeof groups)[];

  return <>{order.map((group) => <div key={group} className={compact ? "contents" : undefined}>{groups[group]}</div>)}</>;
}
