import CategoryCircleGrid from "./CategoryCircleGrid";
import { listAisles, listSections } from "@/lib/categoryCatalog";
import { NESTED_SECTIONS } from "@/lib/sections";
import { loadStoreVisibility } from "@/lib/storeVisibility";

const FIXED_ORDER_SECTIONS = new Set(["sweets"]);

export default async function SectionAisleNav({
  section,
  columns = 3,
}: {
  section: string;
  columns?: 3 | 4 | 6;
}) {
  const visibility = await loadStoreVisibility();
  const nested = listSections(visibility).filter((entry) => NESTED_SECTIONS[entry.slug] === section);
  const all = [...listAisles(visibility, section), ...nested];
  // Sweets keep the shop's own order (lib/sweetsAisles.ts); other sections are alphabetical.
  const items = FIXED_ORDER_SECTIONS.has(section)
    ? all
    : all.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base", numeric: true }));
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
