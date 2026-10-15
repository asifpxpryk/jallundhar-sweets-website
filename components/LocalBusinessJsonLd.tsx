import {
  SHOP_MAP_URL,
  SITE_CITY,
  SITE_COUNTRY,
  SITE_DESCRIPTION,
  SITE_FACEBOOK_URL,
  SITE_GEO,
  SITE_NAME,
  SITE_PHONE,
  SITE_REGION,
  SITE_STREET_ADDRESS,
  SITE_URL,
} from "@/lib/site";
import { jsonLdString } from "@/lib/seo";

/** Site-wide structured data: the shop as a Bakery (LocalBusiness) plus the WebSite. */
export default function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Bakery",
        "@id": `${SITE_URL}/#bakery`,
        name: SITE_NAME,
        alternateName: ["Jallundhar Sweets", "Jallundhar Sweets and Bakers"],
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        image: [`${SITE_URL}/images/shop-exterior.webp`, `${SITE_URL}/hero.webp`, `${SITE_URL}/og-share.webp`],
        telephone: SITE_PHONE,
        priceRange: "Rs 1–2,000",
        currenciesAccepted: "PKR",
        servesCuisine: ["Bakery", "Pakistani Sweets", "Mithai", "Cakes", "Fast Food"],
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE_STREET_ADDRESS,
          addressLocality: SITE_CITY,
          addressRegion: SITE_REGION,
          addressCountry: SITE_COUNTRY,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: SITE_GEO.latitude,
          longitude: SITE_GEO.longitude,
        },
        hasMap: SHOP_MAP_URL,
        areaServed: { "@type": "City", name: SITE_CITY },
        sameAs: [SITE_FACEBOOK_URL],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: "en-PK",
        publisher: { "@id": `${SITE_URL}/#bakery` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdString(data) }}
    />
  );
}
