import CircleMenuGrid from "./CircleMenuGrid";
import { loadStoreVisibility, visibleAisles } from "@/lib/storeVisibility";

export default async function GeneralAisleNav() {
  const visibility = await loadStoreVisibility();
  return (
    <CircleMenuGrid
      flush
      items={visibleAisles(visibility).map((aisle) => ({
        href: `/general/${aisle.slug}`,
        name: aisle.name,
        image: aisle.image,
      }))}
    />
  );
}
