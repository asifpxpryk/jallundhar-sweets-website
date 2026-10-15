import { listAisles } from "@/lib/categoryCatalog";
import { loadSearchCatalog } from "@/lib/searchCatalog";
import { loadStoreVisibility } from "@/lib/storeVisibility";
import {
  absoluteUrl,
  displayOffer,
  feedImage,
  feedId,
  nonAlcoholicOverride,
  googleProductCategory,
  productPath,
  PRODUCT_CANONICAL_ALIASES,
} from "@/lib/seo";
import { feedDescription, feedGtin, feedProductType, feedTitle, loadBrandLookup } from "@/lib/merchantFeed";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Rebuilt from the live catalog (aisle items + Supabase menu overrides) at most once an hour.
export const revalidate = 43200;
// Regeneration reads Supabase (12s timeout) plus ~2,200 items; give it headroom so a slow fetch never 500s.
export const maxDuration = 60;

function xml(value: string) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function clip(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

export async function GET() {
  const [catalog, visibility] = await Promise.all([loadSearchCatalog(), loadStoreVisibility()]);
  const aisleNames = new Map<string, string>();
  for (const category of catalog) {
    for (const aisle of listAisles(visibility, category.slug)) aisleNames.set(`${category.slug}:${aisle.slug}`, aisle.name);
  }
  const seen = new Set<string>();
  const items: string[] = [];
  let skippedNoImage = 0;
  let skippedNoPrice = 0;
  let skippedAlias = 0;
  let skippedSharedImage = 0;
  let withGtin = 0;
  let ownBrand = 0;
  let otherBrand = 0;
  let noBrand = 0;
  let retitled = 0;

  type Candidate = { item: (typeof catalog)[number]["items"][number]; category: (typeof catalog)[number]; price: number; inStock: boolean; image: string };
  const candidates: Candidate[] = [];
  const firstForImage = new Set<string>();
  for (const category of catalog) {
    for (const item of category.items) {
      if (!item.id || item.preview_only || item.is_hidden || seen.has(item.id)) continue;
      seen.add(item.id);
      if (PRODUCT_CANONICAL_ALIASES[item.id]) {
        skippedAlias += 1; // size option whose page canonical is the parent product
        continue;
      }
      const { price, inStock } = displayOffer(item);
      const image = feedImage(item);
      if (!(price > 0)) {
        skippedNoPrice += 1;
        continue;
      }
      if (!image) {
        skippedNoImage += 1;
        continue;
      }
      const imageKey = image.split("?")[0];
      if (firstForImage.has(imageKey)) {
        skippedSharedImage += 1; // same photo as an earlier (main) item: Google flags mismatched images
        continue;
      }
      firstForImage.add(imageKey);
      candidates.push({ item, category, price, inStock, image });
    }
  }

  const brandLookup = await loadBrandLookup();

  for (const { item, category, price, inStock, image } of candidates) {
    const aisleName = item.search_aisle
      ? aisleNames.get(`${category.slug}:${item.search_aisle}`) ??
        item.search_aisle.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "";
    const safe = nonAlcoholicOverride(item, category.slug);
    const productType = feedProductType(safe?.productType ?? (aisleName ? `${category.name} > ${aisleName}` : category.name));
    const title = feedTitle(safe?.title ?? item.name);
    if (title !== (safe?.title ?? item.name)) retitled += 1;
    const brand = safe?.brand ?? brandLookup.get(item.id) ?? null;
    if (!brand) noBrand += 1;
    else if (brand === "Jallundhar Sweets") ownBrand += 1;
    else otherBrand += 1;
    const gtin = feedGtin(item.id);
    if (gtin) withGtin += 1;
    items.push(
      [
        "    <item>",
        `      <g:id>${xml(feedId(item.id))}</g:id>`,
        `      <title>${xml(clip(title, 150))}</title>`,
        `      <description>${xml(clip(safe?.description ?? feedDescription(item, title, category.slug, productType, brand), 5000))}</description>`,
        `      <link>${xml(absoluteUrl(productPath(item.id)))}</link>`,
        `      <g:image_link>${xml(image)}</g:image_link>`,
        `      <g:price>${price.toFixed(2)} PKR</g:price>`,
        `      <g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>`,
        ...(brand ? [`      <g:brand>${xml(brand)}</g:brand>`] : []),
        "      <g:condition>new</g:condition>",
        ...(gtin ? [`      <g:gtin>${gtin}</g:gtin>`] : ["      <g:identifier_exists>no</g:identifier_exists>"]),
        "      <g:adult>no</g:adult>",
        `      <g:google_product_category>${xml(safe?.category ?? googleProductCategory(category.slug, item.search_aisle))}</g:google_product_category>`,
        `      <g:product_type>${xml(productType)}</g:product_type>`,
        "    </item>",
      ].join("\n")
    );
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "  <channel>",
    `    <title>${xml(SITE_NAME)}</title>`,
    `    <link>${SITE_URL}</link>`,
    `    <description>${xml(SITE_DESCRIPTION)}</description>`,
    `    <!-- items: ${items.length}; skipped without image: ${skippedNoImage}; skipped without price: ${skippedNoPrice}; skipped size aliases: ${skippedAlias}; skipped shared photo: ${skippedSharedImage}; gtin: ${withGtin}; brand own/other/none: ${ownBrand}/${otherBrand}/${noBrand}; retitled: ${retitled}; generated: ${new Date().toISOString()} -->`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=43200, stale-while-revalidate=604800",
      "X-Feed-Items": String(items.length),
      "X-Feed-Skipped": String(skippedNoImage + skippedNoPrice),
    },
  });
}
