"use client";

import type { MenuCategory } from "@/lib/types";
import { CartProvider } from "./CartContext";
import Header from "./Header";
import Hero from "./Hero";
import CategoryNav from "./CategoryNav";
import MenuSection from "./MenuSection";
import CartDrawer from "./CartDrawer";
import Footer from "./Footer";

export default function StorefrontApp({ categories }: { categories: MenuCategory[] }) {
  return (
    <CartProvider>
      <Header />
      <Hero />
      <CategoryNav />
      <main>
        {categories.map((category) => (
          <MenuSection key={category.id} category={category} />
        ))}
      </main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
