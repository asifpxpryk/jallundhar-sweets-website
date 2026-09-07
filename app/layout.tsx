import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

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
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
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
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
