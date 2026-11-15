/** Looks up today's selling price for each cart id, from the same cached catalogue the pages show. */
import { productLine } from "@/lib/cartLine";
import { kitchenLineId, kitchenLineName, visibleKitchenGroups, type KitchenGroup } from "@/lib/liveKitchen";
import { loadKitchenConfig } from "@/lib/liveKitchenStore";
import type { CatalogPrice } from "@/lib/orderPricing";
import { posPreviewPrice } from "@/lib/posBeveragePreview";
import { loadProduct } from "@/lib/product";
import { isWeighedSweet, weighedCartLine } from "@/lib/sweetWeight";
import type { MenuItem } from "@/lib/types";

function validPrices(values: number[]): number[] {
  return [...new Set(values.filter((value) => Number.isFinite(value) && value >= 0))];
}

/** Catalogue product: the cart may hold today's price (deal included), the plain price, or a beverage card's POS price. */
function menuEntry(item: MenuItem): CatalogPrice {
  const line = productLine(item);
  const weighable = isWeighedSweet(item);
  return {
    name: weighable ? weighedCartLine(line, 1).name : line.name,
    prices: validPrices([line.price, Number(item.price), posPreviewPrice(item.name) ?? Number.NaN]),
    available: item.is_available !== false && !item.preview_only,
    weighable,
  };
}

function kitchenEntries(groups: KitchenGroup[]): Map<string, CatalogPrice> {
  const entries = new Map<string, CatalogPrice>();
  for (const group of visibleKitchenGroups(groups)) {
    for (const item of group.items) {
      const sizes = item.sizes?.length ? item.sizes : [undefined];
      for (const size of sizes) {
        entries.set(kitchenLineId(item, size), {
          name: kitchenLineName(item, size),
          prices: validPrices([size ? size.price : item.price ?? 0]),
          available: true,
          weighable: false,
        });
      }
    }
  }
  return entries;
}

/** One entry per id; null means the shop no longer sells it online. Throws when the catalogue can't be read. */
export async function loadOrderCatalog(ids: string[]): Promise<Map<string, CatalogPrice | null>> {
  const kitchen = kitchenEntries((await loadKitchenConfig()).groups);
  const catalog = new Map<string, CatalogPrice | null>();
  for (const id of ids) {
    const fromKitchen = kitchen.get(id);
    if (fromKitchen) {
      catalog.set(id, fromKitchen);
      continue;
    }
    const found = await loadProduct(id);
    catalog.set(id, found ? menuEntry(found.item) : null);
  }
  return catalog;
}
