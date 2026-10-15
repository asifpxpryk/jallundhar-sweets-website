import { loadAllMenuItemsCached, loadMenu } from "@/lib/loadMenu";
import {
  beverageAisleCatalogItems,
  beveragePreviewItems,
  tagBeverageItems,
} from "@/lib/posBeveragePreview";
import { NextResponse } from "next/server";

export const revalidate = 43200;

export async function GET() {
  try {
    const [categories, knownProducts] = await Promise.all([loadMenu(), loadAllMenuItemsCached()]);
    return NextResponse.json(
      categories.map((category) => {
        if (category.slug !== "beverage") return category;
        // Prefer real aisle SKUs (one price, cartable ids) then POS-only fill-ins.
        const seeded = tagBeverageItems([
          ...beverageAisleCatalogItems(),
          ...category.items,
        ]);
        return {
          ...category,
          items: beveragePreviewItems(seeded, undefined, [
            ...knownProducts,
            ...beverageAisleCatalogItems(),
          ]),
        };
      })
    );
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}