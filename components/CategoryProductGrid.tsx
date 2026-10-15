"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import BestsellerScroller from "./BestsellerScroller";
import CategoryCatalogBar, { type CatalogSort } from "./CategoryCatalogBar";
import { useIsAdmin } from "./AdminSessionContext";
import { buildBrandIndex } from "@/lib/catalogBrand";
import { hasCatalogPhoto, keepsComingSoonCards } from "@/lib/catalogPhoto";
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
  const [brand, setBrand] = useState("all");
  const [beverageType, setBeverageType] = useState("all");
  const [search, setSearch] = useState("");
  const [hashItemId, setHashItemId] = useState("");
  const [sortBy, setSortBy] = useState<CatalogSort>("default");
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
    setBrand("all");
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
  const beverageTypes = [...new Set(list.map((item) => item.beverage_type).filter((value): value is string => Boolean(value)))]
    .sort((a, b) => a.localeCompare(b));
  const priceOf = (item: MenuItem) => Number(item.price) || 0;
  const generalPage = aisleSection === "general" || menuSlug === "general";
  const generalHome = menuSlug === "general" && !aisleSlug;
  const showComingSoon = keepsComingSoonCards(aisleSlug);
  const shelf = adminFiltered.filter(
    (item) => isAdmin || !generalPage || showComingSoon || hasCatalogPhoto(item)
  );
  const brands = buildBrandIndex(shelf);
  const filtered = shelf
    .filter((item) => !beverageCatalog || isAdmin || brand !== "all" || Boolean(search.trim()) || item.id === hashItemId || Boolean(item.image_url))
    .filter((item) => brand === "all" || brands.choiceFor(item) === brand)
    .filter((item) => beverageType === "all" || item.beverage_type === beverageType)
    .filter((item) => !search.trim() || normalizeName(item.name).includes(normalizeName(search)))
    .sort((a, b) => {
      if (sortBy === "price-asc") return priceOf(a) - priceOf(b) || a.name.localeCompare(b.name);
      if (sortBy === "price-desc") return priceOf(b) - priceOf(a) || a.name.localeCompare(b.name);
      if (sortBy === "brand") return (brands.brandOf(a) ?? "\uffff").localeCompare(brands.brandOf(b) ?? "\uffff") || a.name.localeCompare(b.name);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "photo") return Number(hasCatalogPhoto(b)) - Number(hasCatalogPhoto(a)) || a.name.localeCompare(b.name);
      if (sortBy === "default" && generalPage) return Number(hasCatalogPhoto(b)) - Number(hasCatalogPhoto(a));
      return 0;
    });
  const shown = filtered.slice(0, visible);
  const bestsellers = generalHome
    ? []
    : list.filter(
        (item) =>
          item.is_bestseller &&
          (isAdmin || !item.is_hidden) &&
          (isAdmin || !generalPage || showComingSoon || hasCatalogPhoto(item))
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
            is_new_arrival: false,
            is_deal: false,
            deal_label: "",
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

  const resetFilters = () => {
    setBrand("all");
    setBeverageType("all");
    setSearch("");
    setSortBy("default");
    setVisible(PAGE_SIZE);
  };
  const catalogBar = shelf.length > 0 ? (
    <CategoryCatalogBar
      total={shelf.length}
      shown={filtered.length}
      brands={brands.choices}
      showBrand={brands.showBrand}
      brand={brand}
      onBrand={(value) => {
        setBrand(value);
        setVisible(PAGE_SIZE);
      }}
      sort={sortBy}
      onSort={(value) => {
        setSortBy(value);
        setVisible(PAGE_SIZE);
      }}
      query={search}
      onQuery={(value) => {
        setSearch(value);
        setVisible(PAGE_SIZE);
      }}
      beverageTypes={beverageCatalog ? beverageTypes : []}
      beverageType={beverageType}
      onBeverageType={(value) => {
        setBeverageType(value);
        setVisible(PAGE_SIZE);
      }}
      onClear={resetFilters}
      defaultSortLabel={generalPage ? "Photos first" : "Shop order"}
      omitPhotoSort={generalPage}
      hideSearch={generalHome}
    />
  ) : null;

  if (filtered.length > 0) {
    return (
      <div className="mt-2">
        <BestsellerScroller items={bestsellers} embedded aisleSection={aisleSection} />
        {toolbar}
        {catalogBar}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {shown.map((item, index) => (
            <ProductCard
              key={`${item.id}-${item.is_hidden ? "h" : "v"}-${item.is_bestseller ? "b" : "n"}-${item.is_new_arrival ? "a" : "x"}-${item.is_deal ? "d" : "x"}-${item.deal_label ?? ""}`}
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
        {catalogBar}
        <p className="mt-6 text-maroon-700/70">No hidden products in this section.</p>
      </div>
    );
  }

  if (adminFiltered.length > 0 || hasExtra) {
    return (
      <div className="mt-2">
        <BestsellerScroller items={bestsellers} embedded aisleSection={aisleSection} />
        {toolbar}
        {catalogBar}
        {shelf.length > 0 && filtered.length === 0 ? <p className="mt-6 text-maroon-700/70">No products match these filters.</p> : null}
        {shelf.length === 0 && adminFiltered.length > 0 && !isAdmin ? (
          <p className="mt-6 text-maroon-700/70">No products in this section yet.</p>
        ) : null}
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
      {catalogBar}
      {addSlot ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">{addSlot}</div>
      ) : (
        <p className="mt-6 text-maroon-700/70">No products in this section yet.</p>
      )}
    </div>
  );
}
