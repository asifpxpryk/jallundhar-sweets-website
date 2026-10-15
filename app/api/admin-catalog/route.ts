import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/adminAuth";
import { loadMenuIncludingHiddenUncached, loadAllMenuItems } from "@/lib/loadMenu";
import { applyMenuOverrides } from "@/lib/loadAisleItems";
import { isKnownAisle, isKnownSection } from "@/lib/categoryCatalog";
import { homeShelf, loadStoreVisibilityUncached } from "@/lib/storeVisibility";
import { itemsForPlacement } from "@/lib/itemPlacement";
import { tagBeverageItems } from "@/lib/posBeveragePreview";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function placed(
  key: string,
  visibility: Awaited<ReturnType<typeof loadStoreVisibilityUncached>>,
  overrides: Awaited<ReturnType<typeof loadAllMenuItems>>
) {
  return applyMenuOverrides(
    itemsForPlacement(key, visibility, overrides),
    overrides,
    true,
    visibility.hiddenItemIds,
    visibility.bestsellerIds,
    homeShelf(visibility)
  );
}

export async function GET(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const section = String(searchParams.get("section") || "").trim();
  const aisle = String(searchParams.get("aisle") || "").trim();

  try {
    const [visibility, overrides] = await Promise.all([
      loadStoreVisibilityUncached(),
      loadAllMenuItems(),
    ]);
    const knownPreviewIds = overrides
      .filter((item) => item.id.startsWith("pos-preview-"))
      .map((item) => item.id);

    if (aisle && isKnownAisle(visibility, section, aisle)) {
      const items = placed(`${section}:${aisle}`, visibility, overrides);
      return NextResponse.json({
        items: section === "beverage" ? tagBeverageItems(items, aisle) : items,
        knownPreviewIds,
      });
    }

    if (section && isKnownSection(visibility, section)) {
      if (section === "sweets") return NextResponse.json({ items: [] });
      const categories = await loadMenuIncludingHiddenUncached();
      const category = categories.find((entry) => entry.slug === section);
      const sectionItems = section === "beverage"
        ? category?.items ?? []
        : itemsForPlacement(section, visibility, category?.items ?? []);
      const items = applyMenuOverrides(
          sectionItems,
          overrides,
          true,
          visibility.hiddenItemIds,
          visibility.bestsellerIds,
          homeShelf(visibility)
        );
      return NextResponse.json({
        items: section === "beverage" ? tagBeverageItems(items) : items,
        knownPreviewIds,
      });
    }

    return NextResponse.json({ items: [] });
  } catch {
    return NextResponse.json({ items: [] }, { status: 502 });
  }
}
