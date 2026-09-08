import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/adminAuth";
import { loadMenuIncludingHidden, loadAllMenuItems } from "@/lib/loadMenu";
import { loadAisleItems, applyMenuOverrides } from "@/lib/loadAisleItems";
import { isGeneralAisle } from "@/lib/generalAisles";
import { isBeverageAisle } from "@/lib/beverageAisles";
import { loadStoreVisibility } from "@/lib/storeVisibility";
import { isSectionSlug } from "@/lib/sections";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const section = String(searchParams.get("section") || "").trim();
  const aisle = String(searchParams.get("aisle") || "").trim();

  try {
    if (aisle && section === "general" && isGeneralAisle(aisle)) {
      const [visibility, overrides] = await Promise.all([loadStoreVisibility(), loadAllMenuItems()]);
      return NextResponse.json({
        items: applyMenuOverrides(loadAisleItems(aisle), overrides, true, visibility.hiddenItemIds),
      });
    }

    if (aisle && section === "beverage" && isBeverageAisle(aisle)) {
      const [visibility, overrides] = await Promise.all([loadStoreVisibility(), loadAllMenuItems()]);
      return NextResponse.json({
        items: applyMenuOverrides(
          loadAisleItems(`beverage:${aisle}`),
          overrides,
          true,
          visibility.hiddenItemIds
        ),
      });
    }

    if (section && isSectionSlug(section)) {
      const categories = await loadMenuIncludingHidden();
      const category = categories.find((entry) => entry.slug === section);
      return NextResponse.json({ items: category?.items ?? [] });
    }

    return NextResponse.json({ items: [] });
  } catch {
    return NextResponse.json({ items: [] }, { status: 502 });
  }
}
