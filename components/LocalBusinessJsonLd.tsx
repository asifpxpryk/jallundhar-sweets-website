import {
  SITE_CITY,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_PHONE,
  SITE_STREET,
  SITE_URL,
} from "@/lib/site";

export default function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    image: `${SITE_URL}/hero.webp`,
    url: SITE_URL,
    telephone: SITE_PHONE,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_STREET,
      addressLocality: SITE_CITY,
      addressRegion: "Punjab",
      addressCountry: "PK",
    },
    sameAs: ["https://facebook.com/jallundharshahiroad", "https://wa.me/923001538440"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
