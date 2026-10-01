import CategoryCircleGrid from "./CategoryCircleGrid";
import { listAisles } from "@/lib/categoryCatalog";
import { loadStoreVisibility } from "@/lib/storeVisibility";

export default async function SectionAisleNav({
  section,
  columns = 3,
}: {
  section: string;
  columns?: 3 | 4 | 6;
}) {
  const visibility = await loadStoreVisibility();
  const items = listAisles(visibility, section);
  return (
    <CategoryCircleGrid
      flush
      columns={columns}
      kind="aisle"
      parent={section}
      items={items.map((aisle) => ({
        href: aisle.href,
        name: aisle.name,
        image: aisle.image,
        slug: aisle.slug,
        hidden: aisle.hidden,
      }))}
    />
  );
}
