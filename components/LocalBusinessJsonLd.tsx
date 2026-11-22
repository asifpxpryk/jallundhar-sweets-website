import {
  SHOP_HOURS,
  SHOP_MAP_URL,
  SITE_FOUNDING_YEAR,
  SITE_PHONE_INTL,
  SITE_POSTAL_CODE,
  SITE_CITY,
  SITE_COUNTRY,
  SITE_DESCRIPTION,
  SITE_FACEBOOK_URL,
  SITE_GEO,
  SITE_NAME,
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
        image: [`${SITE_URL}/og-share.jpg`, `${SITE_URL}/images/shop-exterior.webp`, `${SITE_URL}/hero.webp`],
        telephone: SITE_PHONE_INTL,
        foundingDate: SITE_FOUNDING_YEAR,
        priceRange: "Rs 1–2,000",
        currenciesAccepted: "PKR",
        servesCuisine: ["Bakery", "Pakistani Sweets", "Mithai", "Cakes", "Fast Food"],
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE_STREET_ADDRESS,
          addressLocality: SITE_CITY,
          addressRegion: SITE_REGION,
          postalCode: SITE_POSTAL_CODE,
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
        ...(SHOP_HOURS
          ? {
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                  opens: SHOP_HOURS.opens,
                  closes: SHOP_HOURS.closes,
                },
              ],
            }
          : {}),
        department: {
          "@type": "Restaurant",
          "@id": `${SITE_URL}/live-kitchen#kitchen`,
          name: `${SITE_NAME} – Live Kitchen`,
          url: `${SITE_URL}/live-kitchen`,
          telephone: SITE_PHONE_INTL,
          servesCuisine: ["Pizza", "Burgers", "Fast Food"],
          address: {
            "@type": "PostalAddress",
            streetAddress: SITE_STREET_ADDRESS,
            addressLocality: SITE_CITY,
            addressRegion: SITE_REGION,
            postalCode: SITE_POSTAL_CODE,
            addressCountry: SITE_COUNTRY,
          },
          // Live Kitchen: 2:00 PM – 2:00 AM daily (closing after midnight).
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
              opens: "14:00",
              closes: "02:00",
            },
          ],
        },
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
