import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/adminAuth";
import { loadMenuIncludingHiddenUncached, loadAllMenuItems } from "@/lib/loadMenu";
import { applyMenuOverrides } from "@/lib/loadAisleItems";
import { isGeneralAisle } from "@/lib/generalAisles";
import { isBeverageAisle } from "@/lib/beverageAisles";
import { isBakeryAisle } from "@/lib/bakeryAisles";
import { isSweetsAisle } from "@/lib/sweetsAisles";
import { loadStoreVisibilityUncached } from "@/lib/storeVisibility";
import { isSectionSlug } from "@/lib/sections";
import { itemsForPlacement } from "@/lib/itemPlacement";

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
    visibility.bestsellerIds
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

    if (aisle && section === "general" && isGeneralAisle(aisle)) {
      return NextResponse.json({ items: placed(`general:${aisle}`, visibility, overrides) });
    }

    if (aisle && section === "beverage" && isBeverageAisle(aisle)) {
      return NextResponse.json({ items: placed(`beverage:${aisle}`, visibility, overrides) });
    }

    if (aisle && section === "bakery" && isBakeryAisle(aisle)) {
      return NextResponse.json({ items: placed(`bakery:${aisle}`, visibility, overrides) });
    }

    if (aisle && section === "sweets" && isSweetsAisle(aisle)) {
      return NextResponse.json({ items: placed(`sweets:${aisle}`, visibility, overrides) });
    }

    if (section && isSectionSlug(section)) {
      if (section === "sweets") return NextResponse.json({ items: [] });
      const categories = await loadMenuIncludingHiddenUncached();
      const category = categories.find((entry) => entry.slug === section);
      return NextResponse.json({
        items: applyMenuOverrides(
          itemsForPlacement(section, visibility, category?.items ?? []),
          overrides,
          true,
          visibility.hiddenItemIds,
          visibility.bestsellerIds
        ),
      });
    }

    return NextResponse.json({ items: [] });
  } catch {
    return NextResponse.json({ items: [] }, { status: 502 });
  }
}
