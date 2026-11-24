import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import ProductDetail from "@/components/ProductDetail";
import { loadProduct } from "@/lib/product";
import { customerProductName } from "@/lib/productName";
import { canonicalProductId, displayOffer, returnPolicyFor, schemaBrand, productDescription, productMetaDescription, productPageDescription, productImage, productTitle, absoluteUrl, jsonLdString, nonAlcoholicOverride, OG_DEFAULTS, clampText } from "@/lib/seo";
import { canonicalSlugFor, loadSlugIndex, resolveProductParam } from "@/lib/productSlugIndex";
import { SITE_URL } from "@/lib/site";
import { feedGtin, gtinProperty, loadBrandLookup } from "@/lib/merchantFeed";

/** 30 days (PRODUCT_PAGE_SECONDS): a changed product is refreshed by its own tag, not by this timer. */
export const revalidate = 2592000;
export const dynamicParams = true;
/**
 * Every product page is built with the deployment. Rendering them on first request instead cost
 * function CPU after each deployment, when crawlers reopened all 4,300 of them. If the catalogue
 * can't be read at build time (or PREBUILD_PRODUCTS=0), pages fall back to being rendered on request.
 */
export async function generateStaticParams() {
  if (process.env.PREBUILD_PRODUCTS === "0") return [];
  try {
    const index = await loadSlugIndex();
    return [...new Set(Object.values(index.byId))].map((id) => ({ id }));
  } catch (error) {
    console.error("Product pages not prebuilt: catalogue unavailable", error);
    return [];
  }
}

type Props = { params: { id: string } };

/**
 * The URL segment is a slug ("akhroti-sohan-halwa-1-kg"). Old ids still open the product but are sent to the
 * slug with a permanent redirect (middleware.ts answers the known ones with a 301 before this runs).
 */
const loadProductPage = cache(async (param: string) => {
  let segment = param;
  try {
    segment = decodeURIComponent(param);
  } catch {
    // keep the raw segment
  }
  const id = await resolveProductParam(segment);
  const result = await loadProduct(id);
  if (!result) notFound();
  const slug = await canonicalSlugFor(result.item);
  if (slug !== segment) permanentRedirect(`/product/${slug}`);
  // A duplicate listing (e.g. "Plain Bread Full") points search engines at the main product's URL.
  const primaryId = canonicalProductId(result.item.id);
  const canonical = primaryId === result.item.id ? slug : await canonicalSlugFor({ id: primaryId, name: "", category_id: "" });
  return { ...result, path: `/product/${canonical}` };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { item, section, path } = await loadProductPage(params.id);
  const named = { ...item, name: customerProductName(item.name, item.category_id || section.slug) };
  // Non-alcoholic malt / "Brewery" drinks: say so in search snippets, matching the Merchant Center feed.
  const safe = nonAlcoholicOverride(item, section.slug);
  const title = safe ? productTitle({ ...named, name: safe.title }) : productTitle(named);
  const description = clampText(safe?.description ?? productMetaDescription(named, section.slug));
  const url = path;
  const image = productImage(item);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      ...OG_DEFAULTS,
      title,
      description,
      url,
      images: image ? [{ url: image, alt: named.name }] : OG_DEFAULTS.images,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { item, section, aisle, related, path } = await loadProductPage(params.id);
  const named = { ...item, name: customerProductName(item.name, item.category_id || section.slug) };
  const { price, inStock } = displayOffer(item);
  const image = productImage(item);
  const url = absoluteUrl(path);
  const safe = nonAlcoholicOverride(item, section.slug);
  const brandLookup = await loadBrandLookup();
  const brand = safe?.brand ?? (brandLookup.has(item.id) ? brandLookup.get(item.id) : schemaBrand(item, section.slug)) ?? null;
  const gtin = feedGtin(item.id);
  // No Product markup without a price: Google's crawler would list it as "Missing product price".
  const productJsonLd = price > 0 ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: safe?.title ?? named.name,
    ...(image ? { image: [image] } : {}),
    description: safe?.description ?? productDescription(named, section.slug),
    sku: item.id,
    ...(gtin ? { [gtinProperty(gtin)]: gtin } : {}),
    category: aisle ? `${section.name} > ${aisle.name}` : section.name,
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
    url,
    offers: {
      "@type": "Offer",
      url,
      price: price.toFixed(2),
      priceCurrency: "PKR",
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${SITE_URL}/#bakery` },
      hasMerchantReturnPolicy: returnPolicyFor(item, section.slug),
    },
  } : null;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: section.name, item: absoluteUrl(section.href) },
      ...(aisle ? [{ "@type": "ListItem", position: 3, name: aisle.name, item: absoluteUrl(aisle.href) }] : []),
      { "@type": "ListItem", position: aisle ? 4 : 3, name: named.name, item: url },
    ],
  };
  return (
    <>
      {productJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(productJsonLd) }} />
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd) }} />
      <ProductDetail item={item} section={section} aisle={aisle} related={related} description={productPageDescription(item) ?? undefined} />
    </>
  );
}
