import { loadSearchCatalog } from "@/lib/searchCatalog";
import { NextResponse } from "next/server";

export const revalidate = 43200;

export async function GET() {
  try {
    return NextResponse.json(await loadSearchCatalog());
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
