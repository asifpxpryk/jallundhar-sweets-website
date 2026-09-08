import { loadMenu } from "@/lib/loadMenu";
import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET() {
  try {
    const categories = await loadMenu();
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
