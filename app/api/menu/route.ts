import { loadAllMenuItems, loadMenu } from "@/lib/loadMenu";
import { beveragePreviewItems, tagBeverageItems } from "@/lib/posBeveragePreview";
import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET() {
  try {
    const [categories, knownProducts] = await Promise.all([loadMenu(), loadAllMenuItems()]);
    return NextResponse.json(categories.map((category) =>
      category.slug === "beverage"
        ? { ...category, items: beveragePreviewItems(tagBeverageItems(category.items), undefined, knownProducts) }
        : category
    ));
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
