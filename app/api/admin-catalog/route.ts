import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/adminAuth";
import { loadMenuIncludingHiddenUncached, loadAllMenuItems } from "@/lib/loadMenu";
import { loadAisleItems, applyMenuOverrides } from "@/lib/loadAisleItems";
import { isGeneralAisle } from "@/lib/generalAisles";
import { isBeverageAisle } from "@/lib/beverageAisles";
import { bakeryItemsOutsideAisles, filterBakeryAisleItems, isBakeryAisle } from "@/lib/bakeryAisles";
import { loadStoreVisibilityUncached } from "@/lib/storeVisibility";
import { isSectionSlug } from "@/lib/sections";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const section = String(searchParams.get("section") || "").trim();
  const aisle = String(searchParams.get("aisle") || "").trim();

  try {
    if (aisle && section === "general" && isGeneralAisle(aisle)) {
      const [visibility, overrides] = await Promise.all([loadStoreVisibilityUncached(), loadAllMenuItems()]);
      return NextResponse.json({
        items: applyMenuOverrides(
          loadAisleItems(aisle),
          overrides,
          true,
          visibility.hiddenItemIds,
          visibility.bestsellerIds
        ),
      });
    }

    if (aisle && section === "beverage" && isBeverageAisle(aisle)) {
      const [visibility, overrides] = await Promise.all([loadStoreVisibilityUncached(), loadAllMenuItems()]);
      return NextResponse.json({
        items: applyMenuOverrides(
          loadAisleItems(`beverage:${aisle}`),
          overrides,
          true,
          visibility.hiddenItemIds,
          visibility.bestsellerIds
        ),
      });
    }

    if (aisle && section === "bakery" && isBakeryAisle(aisle)) {
      const categories = await loadMenuIncludingHiddenUncached();
      const bakery = categories.find((entry) => entry.slug === "bakery");
      return NextResponse.json({
        items: filterBakeryAisleItems(bakery?.items ?? [], aisle),
      });
    }

    if (section && isSectionSlug(section)) {
      const categories = await loadMenuIncludingHiddenUncached();
      const category = categories.find((entry) => entry.slug === section);
      const items = category?.items ?? [];
      return NextResponse.json({
        items: section === "bakery" ? bakeryItemsOutsideAisles(items) : items,
      });
    }

    return NextResponse.json({ items: [] });
  } catch {
    return NextResponse.json({ items: [] }, { status: 502 });
  }
}
