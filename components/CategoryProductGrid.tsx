"use client";

import { useEffect, useState } from "react";
import type { MenuCategory, MenuItem } from "@/lib/types";
import ProductCard from "./ProductCard";

export default function CategoryProductGrid({
  items,
  menuSlug,
  hasExtra = false,
}: {
  items: MenuItem[];
  menuSlug?: string;
  hasExtra?: boolean;
}) {
  const [list, setList] = useState(items);
  const [loading, setLoading] = useState(items.length === 0 && Boolean(menuSlug) && !hasExtra);

  useEffect(() => {
    setList(items);
    if (items.length > 0 || !menuSlug || hasExtra) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/menu", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: MenuCategory[]) => {
        if (cancelled || !Array.isArray(data)) return;
        const category = data.find((entry) => entry.slug === menuSlug);
        setList(category?.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setList([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [items, menuSlug, hasExtra]);

  if (list.length > 0) {
    return (
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {list.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    );
  }

  if (hasExtra) return null;
  if (loading) return <p className="mt-8 text-maroon-700/70">Products loading...</p>;
  return <p className="mt-8 text-maroon-700/70">No products in this section yet.</p>;
}
