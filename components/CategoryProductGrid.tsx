"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import BestsellerScroller from "./BestsellerScroller";
import { useIsAdmin } from "./AdminSessionContext";
import { normalizeName } from "@/lib/sections";
import type { MenuCategory, MenuItem } from "@/lib/types";

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
  aisleSection?: string;
  aisleSlug?: string;
}) {
  const isAdmin = useIsAdmin();
  const pageKey = catalogKey(aisleSection, aisleSlug, menuSlug);
  const [list, setList] = useState(items);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [filter, setFilter] = useState<"all" | "hidden">("all");
  const [company, setCompany] = useState("all");
  const [beverageType, setBeverageType] = useState("all");
  const [search, setSearch] = useState("");
  const [hashItemId, setHashItemId] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [adding, setAdding] = useState(false);
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
      .then((data: { items?: MenuItem[]; knownPreviewIds?: string[] } | null) => {
        if (Array.isArray(data?.items)) {
          const knownIds = new Set([
            ...data.items.map((item) => item.id),
            ...(data.knownPreviewIds ?? []),
          ]);
          setList([
            ...data.items,
            ...items.filter((item) => item.preview_only && !knownIds.has(item.id)),
          ]);
        }
      })
      .catch(() => {
        /* keep current list */
      });
  }, [aisleSection, aisleSlug, isAdmin, items, menuSlug]);

  const skipVisiblePersist = useRef(true);

  useEffect(() => {
    skipVisiblePersist.current = true;
    setVisible(readVisibleCount(pageKey));
    setFilter("all");
    setCompany("all");
    setBeverageType("all");
    setSearch("");
    setHashItemId("");
    setSortBy("default");
    setAdding(false);
  }, [pageKey]);

  useEffect(() => {
    function revealHashedItem() {
      const id = window.location.hash.replace(/^#item-/, "");
      setHashItemId(id);
      if (!id) return;
      const index = list.findIndex((item) => item.id === id);
      if (index < 0) return;
      setVisible((count) => Math.max(count, index + 1));
    }
    revealHashedItem();
    window.addEventListener("hashchange", revealHashedItem);
    return () => window.removeEventListener("hashchange", revealHashedItem);
  }, [list]);

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
  const adminFiltered =
    isAdmin && filter === "hidden"
      ? list.filter((item) => item.is_hidden)
      : list.filter((item) => !item.is_hidden);
  const beverageCatalog = items.some((item) => item.beverage_type || item.preview_only);
  const companyCounts = new Map<string, number>();
  if (beverageCatalog) {
    for (const item of list) {
      const name = item.company || "Other / unbranded";
      companyCounts.set(name, (companyCounts.get(name) ?? 0) + 1);
    }
  }
  const companyForFilter = (item: MenuItem) => {
    const name = item.company || "Other / unbranded";
    return beverageCatalog && (companyCounts.get(name) ?? 0) <= 1 ? "Other / unbranded" : name;
  };
  const companies = [...new Set(list.map(companyForFilter).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const beverageTypes = [...new Set(list.map((item) => item.beverage_type).filter((value): value is string => Boolean(value)))]
    .sort((a, b) => a.localeCompare(b));
  const filtered = adminFiltered
    .filter((item) => !beverageCatalog || isAdmin || company !== "all" || Boolean(search.trim()) || item.id === hashItemId || Boolean(item.image_url))
    .filter((item) => company === "all" || companyForFilter(item) === company)
    .filter((item) => beverageType === "all" || item.beverage_type === beverageType)
    .filter((item) => !search.trim() || normalizeName(item.name).includes(normalizeName(search)))
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price || a.name.localeCompare(b.name);
      if (sortBy === "price-desc") return b.price - a.price || a.name.localeCompare(b.name);
      if (sortBy === "company") return companyForFilter(a).localeCompare(companyForFilter(b)) || a.name.localeCompare(b.name);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });
  const shown = filtered.slice(0, visible);
  const bestsellers = list.filter(
    (item) => item.is_bestseller && (isAdmin || !item.is_hidden)
  );

  const addSlot =
    isAdmin && filter !== "hidden" ? (
      adding ? (
        <ProductCard
          isNew
          item={{
            id: "new",
            category_id: aisleSection || menuSlug || "sweets",
            name: "",
            description: null,
            price: 0,
            image_url: null,
            is_available: true,
            is_hidden: false,
            is_bestseller: false,
            sort_order: 0,
          }}
          aisleSection={aisleSection}
          aisleSlug={aisleSlug}
          onCancel={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            setVisible((count) => count + 1);
            loadAdminCatalog();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex min-h-[18rem] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gold-300 bg-white text-maroon-800 shadow-md transition hover:border-maroon-400 hover:bg-gold-50"
          aria-label="Add product"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-maroon-800 text-4xl leading-none font-light text-white">
            +
          </span>
          <span className="mt-3 text-sm font-semibold">Add product</span>
        </button>
      )
    ) : null;

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

  const beverageToolbar = beverageCatalog ? (
    <div className="mt-5 rounded-2xl border border-gold-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-maroon-800">
          Company
          <select value={company} onChange={(event) => { setCompany(event.target.value); setVisible(PAGE_SIZE); }} className="mt-1 min-h-11 w-full rounded-lg border border-gold-200 bg-white px-3 text-sm">
            <option value="all">All companies</option>
            {companies.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-maroon-800">
          Beverage category
          <select value={beverageType} onChange={(event) => { setBeverageType(event.target.value); setVisible(PAGE_SIZE); }} className="mt-1 min-h-11 w-full rounded-lg border border-gold-200 bg-white px-3 text-sm">
            <option value="all">All categories</option>
            {beverageTypes.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-maroon-800">
          Search beverages
          <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setVisible(PAGE_SIZE); }} placeholder="Product name" className="mt-1 min-h-11 w-full rounded-lg border border-gold-200 bg-white px-3 text-sm" />
        </label>
        <label className="text-xs font-semibold text-maroon-800">
          Sort products
          <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setVisible(PAGE_SIZE); }} className="mt-1 min-h-11 w-full rounded-lg border border-gold-200 bg-white px-3 text-sm">
            <option value="default">Default order</option>
            <option value="company">Company A to Z</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name A to Z</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs text-maroon-700/70">{filtered.length} products shown</p>
    </div>
  ) : null;

  if (filtered.length > 0) {
    return (
      <div className="mt-2">
        <BestsellerScroller items={bestsellers} embedded aisleSection={aisleSection} />
        {toolbar}
        {beverageToolbar}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {shown.map((item, index) => (
            <ProductCard
              key={`${item.id}-${item.is_hidden ? "h" : "v"}-${item.is_bestseller ? "b" : "n"}`}
              item={item}
              priority={index < 4}
              onSaved={isAdmin ? loadAdminCatalog : undefined}
              aisleSection={aisleSection}
              aisleSlug={aisleSlug}
            />
          ))}
          {addSlot}
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
        <BestsellerScroller items={bestsellers} embedded aisleSection={aisleSection} />
        {toolbar}
        {beverageToolbar}
        <p className="mt-6 text-maroon-700/70">No hidden products in this section.</p>
      </div>
    );
  }

  if (hasExtra) {
    return (
      <div className="mt-2">
        <BestsellerScroller items={bestsellers} embedded aisleSection={aisleSection} />
        {toolbar}
        {beverageToolbar}
        {beverageCatalog && filtered.length === 0 ? <p className="mt-6 text-maroon-700/70">No products match these filters.</p> : null}
        {addSlot ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{addSlot}</div>
        ) : null}
      </div>
    );
  }
  if (loading) return <p className="mt-8 text-maroon-700/70">Products loading...</p>;
  return (
    <div className="mt-2">
      <BestsellerScroller items={bestsellers} embedded aisleSection={aisleSection} />
      {toolbar}
      {beverageToolbar}
      {addSlot ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{addSlot}</div>
      ) : (
        <p className="mt-6 text-maroon-700/70">No products in this section yet.</p>
      )}
    </div>
  );
}
