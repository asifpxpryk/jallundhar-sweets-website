import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import ProtectImages from "@/components/ProtectImages";
import StorefrontShell from "@/components/StorefrontShell";
import LocalBusinessJsonLd from "@/components/LocalBusinessJsonLd";
import { loadStoreVisibility } from "@/lib/storeVisibility";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Jallundhar Sweets & Bakers | Shahi Road, Rahim Yar Khan",
  description: SITE_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jallundhar",
  },
  openGraph: {
    type: "website",
    locale: "en_PK",
    siteName: SITE_NAME,
    title: "Jallundhar Sweets & Bakers | Shahi Road, Rahim Yar Khan",
    description: SITE_DESCRIPTION,
    images: [{ url: "/hero.webp", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jallundhar Sweets & Bakers | Shahi Road, Rahim Yar Khan",
    description: SITE_DESCRIPTION,
    images: ["/hero.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon-32.png?v=3", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png?v=3", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png?v=3", sizes: "512x512", type: "image/png" },
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
  return (
    <html lang="en">
      <body className="font-display text-maroon-900 antialiased">
        <LocalBusinessJsonLd />
        <ProtectImages />
        <StorefrontShell hiddenSections={visibility.hiddenSections}>{children}</StorefrontShell>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
