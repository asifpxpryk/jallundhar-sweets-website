"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "./CartContext";
import Header from "./Header";
import CartDrawer from "./CartDrawer";
import Footer from "./Footer";
import BottomNav from "./BottomNav";

export default function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <Header />
      <div className="pb-20 xl:pb-0">
        {children}
        <Footer />
      </div>
      <CartDrawer />
      <BottomNav />
    </CartProvider>
  );
}
