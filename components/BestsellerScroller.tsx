"use client";

import Link from "next/link";
import type { MenuItem } from "@/lib/types";
import ScrollProductCard from "./ScrollProductCard";

export default function BestsellerScroller({
  items,
  embedded = false,
}: {
  items: MenuItem[];
  embedded?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className={embedded ? "pb-2 pt-4" : "mx-auto max-w-6xl px-4 pb-4 pt-2 sm:px-6"}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="font-display text-xl font-bold text-maroon-800 sm:text-2xl">Our Bestsellers</h2>
        {embedded ? null : (
          <Link
            href="/sweets"
            className="flex-shrink-0 text-sm font-medium text-maroon-800 hover:text-gold-600"
          >
            View All →
          </Link>
        )}
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-1 scrollbar-hide sm:gap-4">
        {items.map((item, index) => (
          <ScrollProductCard key={item.id} item={item} priority={index < 4} />
        ))}
      </div>
    </section>
  );
}
