import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import { loadProduct } from "@/lib/product";
import { customerProductName } from "@/lib/productName";
import { canonicalProductId, displayOffer, returnPolicyFor, schemaBrand, productDescription, productImage, productPath, productTitle, absoluteUrl, jsonLdString, nonAlcoholicOverride, OG_DEFAULTS } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { feedGtin, gtinProperty, loadBrandLookup } from "@/lib/merchantFeed";

export const revalidate = 43200;
export const dynamicParams = true;
/** Rendered on first request, then cached for an hour (2,000+ products are not prebuilt to keep deployments small). */
export function generateStaticParams() {
  return [];
}

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await loadProduct(params.id);
  if (!result) notFound();
  const { item, section } = result;
  const named = { ...item, name: customerProductName(item.name, item.category_id || section.slug) };
  // Non-alcoholic malt / "Brewery" drinks: say so in search snippets, matching the Merchant Center feed.
  const safe = nonAlcoholicOverride(item, section.slug);
  const title = safe ? productTitle({ ...named, name: safe.title }) : productTitle(named);
  const description = safe?.description ?? productDescription(named, section.slug);
  const url = productPath(canonicalProductId(item.id));
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
  const result = await loadProduct(params.id);
  if (!result) notFound();
  const { item, section, aisle, related } = result;
  const named = { ...item, name: customerProductName(item.name, item.category_id || section.slug) };
  const { price, inStock } = displayOffer(item);
  const image = productImage(item);
  const url = absoluteUrl(productPath(canonicalProductId(item.id)));
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
      <ProductDetail item={item} section={section} aisle={aisle} related={related} />
    </>
  );
}
