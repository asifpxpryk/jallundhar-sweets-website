import CategoryCircleGrid from "./CategoryCircleGrid";
import { listAisles, listSections } from "@/lib/categoryCatalog";
import { hasCatalogPhoto, keepsComingSoonCards } from "@/lib/catalogPhoto";
import { itemsForPlacement } from "@/lib/itemPlacement";
import { loadAllMenuItemsCached } from "@/lib/loadMenu";
import { LOOSE_PACK_AISLES, LOOSE_PACK_SECTION } from "@/lib/loosePacks";
import { NESTED_SECTIONS } from "@/lib/sections";
import { loadStoreVisibility, type StoreVisibility } from "@/lib/storeVisibility";
import type { MenuItem } from "@/lib/types";

type AisleTile = { href: string; name: string; image?: string; slug: string; hidden?: boolean };

/** Sections whose grid leaves out aisles with nothing to show, so a tap never lands on an empty page. */
const SKIPS_EMPTY_AISLES = new Set(["general"]);

/** The loose dry fruit and masala packs have their own pages; General links to them as one tile. */
const LOOSE_PACK_TILE: AisleTile = {
  href: LOOSE_PACK_SECTION.href,
  name: LOOSE_PACK_SECTION.name,
  image: LOOSE_PACK_AISLES[0].image,
  slug: LOOSE_PACK_SECTION.slug,
};

function hasShownItems(section: string, aisle: string, visibility: StoreVisibility, menu: MenuItem[]): boolean {
  const hidden = new Set(visibility.hiddenItemIds ?? []);
  return itemsForPlacement(`${section}:${aisle}`, visibility, menu).some(
    (item) => !item.is_hidden && !hidden.has(item.id) && (hasCatalogPhoto(item) || keepsComingSoonCards(aisle))
  );
}

export default async function SectionAisleNav({
  section,
  columns = 3,
}: {
  section: string;
  columns?: 3 | 4 | 6;
}) {
  const visibility = await loadStoreVisibility();
  const nested = listSections(visibility).filter((entry) => NESTED_SECTIONS[entry.slug] === section);
  let aisles: AisleTile[] = listAisles(visibility, section);
  if (SKIPS_EMPTY_AISLES.has(section)) {
    const menu = await loadAllMenuItemsCached();
    aisles = aisles.filter((aisle) => hasShownItems(section, aisle.slug, visibility, menu));
  }
  const extra = section === "general" ? [LOOSE_PACK_TILE] : [];
  const items = [...aisles, ...nested, ...extra].sort((a, b) =>
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
