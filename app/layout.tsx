import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import StorefrontShell from "@/components/StorefrontShell";

export const metadata: Metadata = {
  title: "Jallundhar Sweets & Bakers | Shahi Road, Rahim Yar Khan",
  description:
    "From Sweet to Savory, All Your Cravings, One Place. Order mithai, bakery, cakes, pizza, burgers & more from Jallundhar Sweets & Bakers, Shahi Road, Rahim Yar Khan.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jallundhar",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon-32.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#7a1f25",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-display text-maroon-900 antialiased">
        <StorefrontShell>
          {children}
        </StorefrontShell>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
