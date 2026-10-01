"use client";

import { useState } from "react";
import { trackAddToCart } from "@/lib/metaPixel";
import type { MenuItem } from "@/lib/types";
import { useCart } from "./CartContext";

export default function SweetProductActions({ item }: { item: MenuItem }) {
  const { add, open } = useCart();
  const variants = item.variants;
  const defaultVariant =
    variants?.find((variant) => variant.label === "Medium") ??
    variants?.find((variant) => variant.label === "Full") ??
    variants?.[0];
  const [selectedId, setSelectedId] = useState(defaultVariant?.id ?? item.id);
  const selected = variants?.find((variant) => variant.id === selectedId);
  const price = selected?.price ?? item.price;
  const inStock = selected ? selected.is_available !== false : item.is_available !== false;

  function addToCart() {
    if (!inStock) return;
    if (selected) {
      const line = { ...item, id: selected.id, name: `${item.name} (${selected.label})`, price };
      add(line);
      trackAddToCart({
        content_ids: [String(selected.id)],
        content_name: line.name,
        value: price,
        contents: [{ id: String(selected.id), quantity: 1, item_price: price }],
      });
    } else {
      add(item);
      trackAddToCart({
        content_ids: [String(item.id)],
        content_name: item.name,
        value: item.price,
        contents: [{ id: String(item.id), quantity: 1, item_price: item.price }],
      });
    }
    open();
  }

  return (
    <div className="mt-7">
      {variants?.length ? (
        <div className="mb-5">
          <p className="mb-2 text-sm font-semibold text-maroon-800">Choose size</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedId(variant.id)}
                aria-pressed={selectedId === variant.id}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedId === variant.id
                    ? "bg-maroon-800 text-white"
                    : "bg-gold-50 text-maroon-800 ring-1 ring-gold-200 hover:bg-gold-100"
                }`}
              >
                {variant.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <p className="font-display text-2xl font-bold text-maroon-900">Rs. {price.toLocaleString()}</p>
      <p className={`mt-1 text-sm ${inStock ? "text-emerald-700" : "text-red-700"}`}>
        {inStock ? "Available" : "Out of stock"}
      </p>
      <div className="mt-6">
        <button
          type="button"
          onClick={addToCart}
          disabled={!inStock}
          className={`min-h-12 rounded-xl px-6 py-3 text-sm font-semibold text-white transition ${
            inStock ? "bg-maroon-800 hover:bg-maroon-900" : "cursor-not-allowed bg-maroon-300"
          }`}
        >
          {inStock ? "Add to Cart" : "Out of stock"}
        </button>
      </div>
    </div>
  );
}
