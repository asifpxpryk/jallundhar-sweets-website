import type { MenuCategory } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function MenuSection({ category }: { category: MenuCategory }) {
  if (category.items.length === 0) return null;

  return (
    <section id={category.slug} className="scroll-mt-20 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-2xl font-bold text-maroon-800 sm:text-3xl">
          {category.name}
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {category.items.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
