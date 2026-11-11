import CategoryCircleGrid from "./CategoryCircleGrid";
import { listAisles, listSections } from "@/lib/categoryCatalog";
import { NESTED_SECTIONS } from "@/lib/sections";
import { loadStoreVisibility } from "@/lib/storeVisibility";

export default async function SectionAisleNav({
  section,
  columns = 3,
}: {
  section: string;
  columns?: 3 | 4 | 6;
}) {
  const visibility = await loadStoreVisibility();
  const nested = listSections(visibility).filter((entry) => NESTED_SECTIONS[entry.slug] === section);
  const items = [...listAisles(visibility, section), ...nested].sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base", numeric: true })
  );
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
