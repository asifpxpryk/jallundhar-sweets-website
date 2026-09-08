import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import StorefrontShell from "@/components/StorefrontShell";
import { loadStoreVisibility } from "@/lib/storeVisibility";

export const metadata: Metadata = {
  title: "Jallundhar Sweets & Bakers | Shahi Road, Rahim Yar Khan",
  description:
    "From Sweet to Savory, All Your Cravings, One Place. Order mithai, bakery, custom cakes, pizza, burgers & more from Jallundhar Sweets & Bakers, Shahi Road, Rahim Yar Khan.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jallundhar",
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
        <StorefrontShell hiddenSections={visibility.hiddenSections}>{children}</StorefrontShell>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
