import { NextResponse, type NextRequest } from "next/server";
import legacySlugs from "@/data/product-legacy-slugs.json";

const LEGACY = legacySlugs as Record<string, string>;

/**
 * Old product URLs (/product/4661, /product/item-1788947471186, /product/pos-prd-1161) answer with a
 * permanent 301 to the readable slug. Ids not in this frozen list (products added later) are redirected
 * by the product page itself.
 */
export function middleware(request: NextRequest) {
  const segment = request.nextUrl.pathname.slice("/product/".length).replace(/\/+$/, "");
  let id = segment;
  try {
    id = decodeURIComponent(segment);
  } catch {
    // Malformed escape: leave it for the page to 404.
  }
  const slug = LEGACY[id];
  if (!slug || slug === id) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/product/${slug}`;
  return NextResponse.redirect(url, 301);
}

/**
 * Only the old id shapes reach this (every key in the list matches one). Readable slugs, which crawlers
 * open all day, skip it entirely and cost no function time.
 */
export const config = {
  matcher: ["/product/:id(pos-.+|item-.+|\\d+|cream-cake-oreo-2-pound)"],
};
