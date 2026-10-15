import CategoryCircleGrid from "./CategoryCircleGrid";
import { listSections } from "@/lib/categoryCatalog";
import { loadStoreVisibility } from "@/lib/storeVisibility";

export default async function CategoryNav({ rise = false }: { rise?: boolean }) {
  const visibility = await loadStoreVisibility();
  return (
    <div id="categories">
      <CategoryCircleGrid
        columns={6}
        kind="section"
        rise={rise}
        items={listSections(visibility).map((cat) => ({
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
