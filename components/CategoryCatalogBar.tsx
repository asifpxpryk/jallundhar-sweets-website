"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatProductCount, type BrandChoice } from "@/lib/catalogBrand";

export type CatalogSort = "default" | "brand" | "price-asc" | "price-desc" | "name" | "photo";

const controlClass = "mt-1 min-h-11 w-full rounded-lg border border-gold-200 bg-white px-3 text-sm text-maroon-800";

function CatalogSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((option) => option.value === value)?.label ?? "";

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0 text-xs font-semibold text-maroon-800">
      <span id={`${listId}-label`}>{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${listId}-label`}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        className={`${controlClass} flex items-center justify-between gap-2 text-left font-semibold`}
      >
        <span className="min-w-0 truncate">{current}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          aria-hidden
          className={`shrink-0 transition ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={`${listId}-label`}
          className="absolute left-0 top-full z-40 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-gold-200 bg-white py-1 shadow-lg"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex min-h-11 w-full items-center px-3 text-left text-sm ${
                    selected ? "bg-maroon-800 font-semibold text-white" : "text-maroon-800 hover:bg-gold-50"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function CategoryProductCount({ count }: { count: number }) {
  if (count < 1) return null;
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-gold-100 px-2.5 py-0.5 align-middle text-xs font-semibold tracking-normal text-maroon-800 sm:text-sm">
      {formatProductCount(count)}
    </span>
  );
}

export default function CategoryCatalogBar({
  total,
  shown,
  brands,
  showBrand,
  brand,
  onBrand,
  sort,
  onSort,
  query,
  onQuery,
  beverageTypes = [],
  beverageType = "all",
  onBeverageType,
  onClear,
  defaultSortLabel = "Shop order",
  omitPhotoSort = false,
  hideSearch = false,
}: {
  total: number;
  shown: number;
  brands: BrandChoice[];
  showBrand: boolean;
  brand: string;
  onBrand: (value: string) => void;
  sort: CatalogSort;
  onSort: (value: CatalogSort) => void;
  query: string;
  onQuery: (value: string) => void;
  beverageTypes?: string[];
  beverageType?: string;
  onBeverageType?: (value: string) => void;
  onClear: () => void;
  defaultSortLabel?: string;
  omitPhotoSort?: boolean;
  hideSearch?: boolean;
}) {
  const showType = beverageTypes.length > 1 && Boolean(onBeverageType);
  const fields = 1 + (hideSearch ? 0 : 1) + (showBrand ? 1 : 0) + (showType ? 1 : 0);
  const columns = fields >= 4 ? "lg:grid-cols-4" : fields === 3 ? "lg:grid-cols-3" : "";
  const wide = fields >= 2 ? "sm:grid-cols-2" : "";
  const filtersActive = brand !== "all" || beverageType !== "all" || Boolean(query.trim()) || sort !== "default";
  const narrowed = shown !== total;

  return (
    <div className="relative z-20 mt-5 rounded-2xl border border-gold-200 bg-white p-3 shadow-sm sm:p-4">
      <div className={`grid gap-3 ${wide} ${columns}`}>
        {showBrand ? (
          <CatalogSelect
            label="Brand"
            value={brand}
            onChange={onBrand}
            options={[
              { value: "all", label: "All brands" },
              ...brands.map((choice) => ({
                value: choice.label,
                label: `${choice.label} (${choice.count})`,
              })),
            ]}
          />
        ) : null}
        <CatalogSelect
          label="Sort"
          value={sort}
          onChange={(value) => onSort(value as CatalogSort)}
          options={[
            { value: "default", label: defaultSortLabel },
            { value: "brand", label: "Brand A to Z" },
            { value: "price-asc", label: "Price: low to high" },
            { value: "price-desc", label: "Price: high to low" },
            { value: "name", label: "Name A to Z" },
            ...(omitPhotoSort ? [] : [{ value: "photo" as const, label: "Photos first" }]),
          ]}
        />
        {showType ? (
          <CatalogSelect
            label="Beverage category"
            value={beverageType}
            onChange={(value) => onBeverageType?.(value)}
            options={[
              { value: "all", label: "All categories" },
              ...beverageTypes.map((value) => ({ value, label: value })),
            ]}
          />
        ) : null}
        {hideSearch ? null : (
          <label className="text-xs font-semibold text-maroon-800">
            Search
            <input
              type="search"
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search in this category"
              className={controlClass}
            />
          </label>
        )}
      </div>
      {filtersActive || narrowed ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-maroon-700/70">
            Showing {shown} of {total}
          </p>
          {filtersActive ? (
            <button
              type="button"
              onClick={onClear}
              className="min-h-11 shrink-0 rounded-full px-3 text-xs font-semibold text-maroon-800 ring-1 ring-gold-200"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
