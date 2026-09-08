import CircleMenuGrid from "./CircleMenuGrid";
import { loadStoreVisibility, visibleSweetsAisles } from "@/lib/storeVisibility";

export default async function SweetsAisleNav() {
  const visibility = await loadStoreVisibility();
  return (
    <CircleMenuGrid
      flush
      columns={4}
      items={visibleSweetsAisles(visibility).map((aisle) => ({
        href: `/sweets/${aisle.slug}`,
        name: aisle.name,
        image: aisle.image,
      }))}
    />
  );
}
