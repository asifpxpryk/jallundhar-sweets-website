"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MenuCategory, MenuItem } from "@/lib/types";
import ProductCard from "./ProductCard";
import BestsellerScroller from "./BestsellerScroller";
import { useIsAdmin } from "./AdminSessionContext";

const PAGE_SIZE = 24;

function catalogKey(
  aisleSection?: string,
  aisleSlug?: string,
  menuSlug?: string
) {
  if (aisleSection && aisleSlug) return `${aisleSection}:${aisleSlug}`;
  return menuSlug ?? "";
}

function readVisibleCount(key: string) {
  if (!key || typeof window === "undefined") return PAGE_SIZE;
  const stored = Number(sessionStorage.getItem(`admin-grid-visible:${key}`));
  return Number.isFinite(stored) && stored > 0 ? stored : PAGE_SIZE;
}

export default function CategoryProductGrid({
  items,
  menuSlug,
  hasExtra = false,
  aisleSection,
  aisleSlug,
}: {
  items: MenuItem[];
  menuSlug?: string;
  hasExtra?: boolean;
  aisleSection?: "general" | "beverage" | "bakery";
  aisleSlug?: string;
}) {
  const isAdmin = useIsAdmin();
  const pageKey = catalogKey(aisleSection, aisleSlug, menuSlug);
  const [list, setList] = useState(items);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [filter, setFilter] = useState<"all" | "hidden">("all");
  const [loading, setLoading] = useState(items.length === 0 && Boolean(menuSlug) && !hasExtra);

  const loadAdminCatalog = useCallback(() => {
    if (!isAdmin) return;
    const params = new URLSearchParams();
    if (aisleSection && aisleSlug) {
      params.set("section", aisleSection);
      params.set("aisle", aisleSlug);
    } else if (menuSlug) {
      params.set("section", menuSlug);
    } else {
      return;
    }
    fetch(`/api/admin-catalog?${params.toString()}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { items?: MenuItem[] } | null) => {
        if (Array.isArray(data?.items)) setList(data.items);
      })
      .catch(() => {
        /* keep current list */
      });
  }, [aisleSection, aisleSlug, isAdmin, menuSlug]);

  const skipVisiblePersist = useRef(true);

  useEffect(() => {
    skipVisiblePersist.current = true;
    setVisible(readVisibleCount(pageKey));
    setFilter("all");
  }, [pageKey]);

  useEffect(() => {
    if (!pageKey) return;
    if (skipVisiblePersist.current) {
      skipVisiblePersist.current = false;
      return;
    }
    sessionStorage.setItem(`admin-grid-visible:${pageKey}`, String(visible));
  }, [pageKey, visible]);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(false);
    loadAdminCatalog();
  }, [isAdmin, loadAdminCatalog, pageKey]);

  useEffect(() => {
    if (isAdmin) return;
    setList(items);
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
  }, [hasExtra, isAdmin, items, menuSlug]);

  const hiddenCount = list.filter((item) => item.is_hidden).length;
  const filtered =
    isAdmin && filter === "hidden"
      ? list.filter((item) => item.is_hidden)
      : list.filter((item) => !item.is_hidden);
  const shown = filtered.slice(0, visible);
  const bestsellers = list.filter(
    (item) => item.is_bestseller && (isAdmin || !item.is_hidden)
  );

  const toolbar = isAdmin ? (
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={() => {
          setFilter("all");
          setVisible(PAGE_SIZE);
        }}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
          filter === "all" ? "bg-maroon-800 text-white" : "bg-white text-maroon-800 ring-1 ring-gold-200"
        }`}
      >
        All
      </button>
      <button
        type="button"
        onClick={() => {
          setFilter("hidden");
          setVisible(PAGE_SIZE);
        }}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
          filter === "hidden" ? "bg-maroon-800 text-white" : "bg-white text-maroon-800 ring-1 ring-gold-200"
        }`}
      >
        Hidden{hiddenCount ? ` (${hiddenCount})` : ""}
      </button>
    </div>
  ) : null;

  if (filtered.length > 0) {
    return (
      <div className="mt-2">
        <BestsellerScroller items={bestsellers} embedded />
        {toolbar}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {shown.map((item, index) => (
            <ProductCard
              key={`${item.id}-${item.is_hidden ? "h" : "v"}-${item.is_bestseller ? "b" : "n"}`}
              item={item}
              priority={index < 4}
              onSaved={isAdmin ? loadAdminCatalog : undefined}
            />
          ))}
        </div>
        {visible < filtered.length ? (
          <button
            type="button"
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
            className="mx-auto mt-6 flex min-h-11 w-full max-w-xs items-center justify-center rounded-full bg-maroon-800 px-5 text-sm font-semibold text-white"
          >
            Load more ({filtered.length - visible} left)
          </button>
        ) : null}
      </div>
    );
  }

  if (isAdmin && filter === "hidden") {
    return (
      <div className="mt-2">
        <BestsellerScroller items={bestsellers} embedded />
        {toolbar}
        <p className="mt-6 text-maroon-700/70">No hidden products in this section.</p>
      </div>
    );
  }

  if (hasExtra) {
    return (
      <div className="mt-2">
        <BestsellerScroller items={bestsellers} embedded />
        {toolbar}
      </div>
    );
  }
  if (loading) return <p className="mt-8 text-maroon-700/70">Products loading...</p>;
  return (
    <div className="mt-2">
      <BestsellerScroller items={bestsellers} embedded />
      {toolbar}
      <p className="mt-6 text-maroon-700/70">No products in this section yet.</p>
    </div>
  );
}
