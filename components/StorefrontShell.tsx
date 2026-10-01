"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "./CartContext";
import Header from "./Header";
import CartDrawer from "./CartDrawer";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import { AdminSessionProvider } from "./AdminSessionContext";
import {
  CategoryCatalogProvider,
  type CatalogAisleChoice,
  type CatalogSectionChoice,
} from "./CategoryCatalogContext";

export default function StorefrontShell({
  children,
  hiddenSections = [],
  navSections = [],
  sectionSlugs = [],
  catalogSections = [],
  catalogAisles = [],
}: {
  children: React.ReactNode;
  hiddenSections?: string[];
  navSections?: { href: string; label: string }[];
  sectionSlugs?: string[];
  catalogSections?: CatalogSectionChoice[];
  catalogAisles?: CatalogAisleChoice[];
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <AdminSessionProvider>
        <CategoryCatalogProvider sections={catalogSections} aisles={catalogAisles}>
          <Header hiddenSections={hiddenSections} navSections={navSections} />
          <div className="overflow-x-clip pb-20 xl:pb-0">
            {children}
            {pathname.startsWith("/account") ? null : <Footer />}
          </div>
          <CartDrawer />
          <BottomNav sectionSlugs={sectionSlugs} />
        </CategoryCatalogProvider>
      </AdminSessionProvider>
    </CartProvider>
  );
}
