import CircleMenuGrid from "./CircleMenuGrid";
import { loadStoreVisibility, visibleBakeryAisles } from "@/lib/storeVisibility";

export default async function BakeryAisleNav() {
  const visibility = await loadStoreVisibility();
  return (
    <CircleMenuGrid
      flush
      items={visibleBakeryAisles(visibility).map((aisle) => ({
        href: `/bakery/${aisle.slug}`,
        name: aisle.name,
        image: aisle.image,
      }))}
    />
  );
}
