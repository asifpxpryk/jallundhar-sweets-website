import CategoryCircleGrid from "./CategoryCircleGrid";
import { listSections } from "@/lib/categoryCatalog";
import { loadStoreVisibility } from "@/lib/storeVisibility";
import { isNestedSection } from "@/lib/sections";
import { loadEmptySectionSlugs } from "@/lib/emptySections";

export default async function CategoryNav({ rise = false }: { rise?: boolean }) {
  const [visibility, emptySections] = await Promise.all([loadStoreVisibility(), loadEmptySectionSlugs()]);
  const empty = new Set(emptySections);
  return (
    <div id="categories">
      <CategoryCircleGrid
        columns={6}
        kind="section"
        rise={rise}
        items={listSections(visibility).filter((cat) => !isNestedSection(cat.slug) && !empty.has(cat.slug)).map((cat) => ({
          href: cat.href,
          name: cat.name,
          image: cat.image,
          slug: cat.slug,
          hidden: cat.hidden,
        }))}
      />
    </div>
  );
}
