import { absoluteUrl, jsonLdString } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

/** BreadcrumbList structured data: Home > ...crumbs. Paths are site-relative ("/bakery"). */
export default function BreadcrumbJsonLd({ crumbs }: { crumbs: { name: string; path: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", item: SITE_URL }, ...crumbs.map((crumb) => ({ name: crumb.name, item: absoluteUrl(crumb.path) }))].map(
      (entry, index) => ({ "@type": "ListItem", position: index + 1, name: entry.name, item: entry.item })
    ),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}
