import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import VisitBeacon from "@/components/VisitBeacon";
import MetaPixel from "@/components/MetaPixel";
import ProtectImages from "@/components/ProtectImages";
import StorefrontShell from "@/components/StorefrontShell";
import LocalBusinessJsonLd from "@/components/LocalBusinessJsonLd";
import { listAisles, listSections } from "@/lib/categoryCatalog";
import { loadStoreVisibility, visibleSections } from "@/lib/storeVisibility";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  category: "food",
  formatDetection: { telephone: true },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jallundhar",
  },
  other: { "mobile-web-app-capable": "yes" },
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og-share.webp", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-share.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon-32.png?v=3", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png?v=3", sizes: "48x48", type: "image/png" },
      { url: "/pwa/icon-192.png?v=4", sizes: "192x192", type: "image/png" },
      { url: "/pwa/icon-512.png?v=4", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon-32.png?v=3",
  },
};

export const viewport: Viewport = {
  themeColor: "#7a1f25",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const visibility = await loadStoreVisibility();
  const sections = listSections(visibility);
  const aisles = sections.flatMap((section) =>
    listAisles(visibility, section.slug).map((aisle) => ({
      section: section.slug,
      slug: aisle.slug,
      name: aisle.name,
    }))
  );
  return (
    <html lang="en">
      <body className="font-display text-maroon-900 antialiased">
        <LocalBusinessJsonLd />
        <ProtectImages />
        <StorefrontShell
          hiddenSections={visibility.hiddenSections}
          navSections={visibleSections(visibility).map((section) => ({
            href: `/${section.slug}`,
            label: section.name,
          }))}
          sectionSlugs={sections.map((section) => section.slug)}
          catalogSections={sections.map((section) => ({ slug: section.slug, name: section.name }))}
          catalogAisles={aisles}
        >
          {children}
        </StorefrontShell>
        <MetaPixel />
        <ServiceWorkerRegister />
        <Analytics />
        <VisitBeacon />
      </body>
    </html>
  );
}
