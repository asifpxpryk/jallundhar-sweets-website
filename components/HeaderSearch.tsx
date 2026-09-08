"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { normalizeName } from "@/lib/sections";
import { bakeryAisleForItem, getBakeryAisle } from "@/lib/bakeryAisles";
import { sweetsAisleForItem, getSweetsAisle } from "@/lib/sweetsAisles";
import { useCart } from "./CartContext";
import ProductImage from "./ProductImage";

type Hit = {
  id: string;
  cardId: string;
  name: string;
  price: number;
  image_url: string | null;
  section: string;
  aisle?: string;
  sectionName: string;
  item: MenuItem;
};

function hitForItem(item: MenuItem, category: MenuCategory): Hit {
  const bakeryAisle = category.slug === "bakery" ? bakeryAisleForItem(item.name) ?? undefined : undefined;
  const sweetsAisle = category.slug === "sweets" ? sweetsAisleForItem(item.name) : undefined;
  const aisle = bakeryAisle ?? sweetsAisle;
  return {
    id: item.id,
    cardId: item.id,
    name: item.name,
    price: item.price,
    image_url: item.image_url,
    section: category.slug,
    aisle,
    sectionName: aisle
      ? (bakeryAisle ? getBakeryAisle(bakeryAisle)?.name : getSweetsAisle(aisle)?.name) ?? category.name
      : category.name,
    item,
  };
}

function flatten(categories: MenuCategory[]): Hit[] {
  const hits: Hit[] = [];
  for (const category of categories) {
    for (const item of category.items) {
      const base = hitForItem(item, category);
      hits.push(base);
      for (const variant of item.variants ?? []) {
        hits.push({
          ...base,
          id: variant.id,
          name: `${item.name} (${variant.label})`,
          price: variant.price,
          item: { ...item, id: variant.id, name: `${item.name} (${variant.label})`, price: variant.price },
        });
      }
    }
  }
  return hits;
}

function hitHref(hit: Hit) {
  const path = hit.aisle ? `/${hit.section}/${hit.aisle}` : `/${hit.section}`;
  return `${path}#item-${hit.cardId}`;
}

export default function HeaderSearch() {
  const router = useRouter();
  const { add } = useCart();
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<Hit[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data: MenuCategory[]) => {
        if (!cancelled && Array.isArray(data)) {
          setCatalog(flatten(data));
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, loaded]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const q = normalizeName(query);
    if (q.length < 1) return [];
    return catalog.filter((hit) => normalizeName(hit.name).includes(q)).slice(0, 8);
  }, [catalog, query]);

  function goTo(hit: Hit) {
    setOpen(false);
    setQuery("");
    const href = hitHref(hit);
    const [path, hash] = href.split("#");
    if (window.location.pathname === path) {
      window.location.hash = hash;
      return;
    }
    router.push(href);
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-label="Search"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-300 text-maroon-700"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20 16.5 16.5" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),20rem)] overflow-hidden rounded-2xl border border-gold-200 bg-white shadow-xl">
            <div className="border-b border-gold-100 p-2">
              <input
                ref={inputRef}
                type="search"
                value={query}
                placeholder="Search menu..."
                autoComplete="off"
                aria-label="Search menu"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  if (e.key === "Enter" && results[0]) {
                    e.preventDefault();
                    goTo(results[0]);
                  }
                }}
                className="h-10 w-full rounded-xl border border-gold-200 px-3 text-sm text-maroon-800 outline-none placeholder:text-maroon-700/40 focus:border-maroon-500"
              />
            </div>
            {!loaded ? (
              <p className="px-4 py-3 text-sm text-maroon-700/70">Products loading...</p>
            ) : query.trim().length === 0 ? (
              <p className="px-4 py-3 text-sm text-maroon-700/70">Type mithai, pizza, bread...</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-maroon-700/70">No items found</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto py-1">
                {results.map((hit) => (
                  <li key={`${hit.section}-${hit.id}`}>
                    <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-gold-50">
                      <button
                        type="button"
                        onClick={() => goTo(hit)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        {hit.image_url ? (
                          <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                            <ProductImage
                              src={hit.image_url}
                              alt={hit.name}
                              sizes="40px"
                              className="object-cover"
                            />
                          </span>
                        ) : (
                          <span className="h-10 w-10 shrink-0 rounded-lg bg-gold-50" />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-maroon-800">{hit.name}</span>
                          <span className="text-xs text-maroon-700/60">
                            {hit.sectionName} · Rs. {hit.price.toLocaleString()}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          add(hit.item);
                          setOpen(false);
                        }}
                        className="shrink-0 rounded-full bg-maroon-700 px-2.5 py-1 text-xs font-semibold text-white"
                      >
                        Add
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
