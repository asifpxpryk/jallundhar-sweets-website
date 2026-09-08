"use client";

import { useEffect, useState } from "react";
import type { MenuCategory, MenuItem } from "@/lib/types";
import ProductCard from "./ProductCard";

const PAGE_SIZE = 24;

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
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(items.length === 0 && Boolean(menuSlug) && !hasExtra);

  useEffect(() => {
    setList(items);
    setVisible(PAGE_SIZE);
    if (items.length > 0 || !menuSlug || hasExtra) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/menu")
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
    const shown = list.slice(0, visible);
    return (
      <div className="mt-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {shown.map((item, index) => (
            <ProductCard key={item.id} item={item} priority={index < 4} />
          ))}
        </div>
        {visible < list.length ? (
          <button
            type="button"
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
            className="mx-auto mt-6 flex min-h-11 w-full max-w-xs items-center justify-center rounded-full bg-maroon-800 px-5 text-sm font-semibold text-white"
          >
            Load more ({list.length - visible} left)
          </button>
        ) : null}
      </div>
    );
  }

  if (hasExtra) return null;
  if (loading) return <p className="mt-8 text-maroon-700/70">Products loading...</p>;
  return <p className="mt-8 text-maroon-700/70">No products in this section yet.</p>;
}
