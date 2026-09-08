import CircleMenuGrid from "./CircleMenuGrid";
import { visibleSections, loadStoreVisibility } from "@/lib/storeVisibility";

export default async function CategoryNav() {
  const visibility = await loadStoreVisibility();
  return (
    <div id="categories">
      <CircleMenuGrid
        columns={6}
        items={visibleSections(visibility).map((cat) => ({
          href: `/${cat.slug}`,
          name: cat.name,
          image: cat.image,
        }))}
      />
    </div>
  );
}
