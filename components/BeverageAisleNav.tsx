import CircleMenuGrid from "./CircleMenuGrid";
import { loadStoreVisibility, visibleBeverageAisles } from "@/lib/storeVisibility";

export default async function BeverageAisleNav() {
  const visibility = await loadStoreVisibility();
  return (
    <CircleMenuGrid
      flush
      items={visibleBeverageAisles(visibility).map((aisle) => ({
        href: `/beverage/${aisle.slug}`,
        name: aisle.name,
        image: aisle.image,
      }))}
    />
  );
}
