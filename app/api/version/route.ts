import { NextResponse } from "next/server";
import { getSiteVersionPayload } from "@/lib/site-version";

export const dynamic = "force-dynamic";

/** Ops probe — not linked from the public storefront. */
export async function GET() {
  return NextResponse.json(getSiteVersionPayload());
}
