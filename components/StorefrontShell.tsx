"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "./CartContext";
import Header from "./Header";
import CartDrawer from "./CartDrawer";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import { AdminSessionProvider } from "./AdminSessionContext";

export default function StorefrontShell({
  children,
  hiddenSections = [],
}: {
  children: React.ReactNode;
  hiddenSections?: string[];
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <AdminSessionProvider>
        <Header hiddenSections={hiddenSections} />
        <div className="overflow-x-clip pb-20 xl:pb-0">
          {children}
          {pathname.startsWith("/account") ? null : <Footer />}
        </div>
        <CartDrawer />
        <BottomNav />
      </AdminSessionProvider>
    </CartProvider>
  );
}
