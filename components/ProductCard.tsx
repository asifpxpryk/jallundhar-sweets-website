"use client";

import { useState } from "react";
import type { MenuItem } from "@/lib/types";
import { useCart } from "./CartContext";

export default function ProductCard({ item }: { item: MenuItem }) {
  const { add } = useCart();
  const variants = item.variants;
  const defaultVariant = variants?.find((v) => v.label === "Medium") ?? variants?.[0];
  const [selectedId, setSelectedId] = useState(defaultVariant?.id ?? item.id);
  const selected = variants?.find((v) => v.id === selectedId);
  const price = selected?.price ?? item.price;
  const inStock = selected ? selected.is_available !== false : item.is_available !== false;

  function handleAdd() {
    if (!inStock) return;
    if (selected) {
      add({
        ...item,
        id: selected.id,
        name: `${item.name} (${selected.label})`,
        price: selected.price,
      });
      return;
    }
    add(item);
  }

  return (
    <div id={`item-${item.id}`} className="scroll-mt-24 flex flex-col justify-between overflow-hidden rounded-2xl border border-gold-100 bg-white shadow-sm transition hover:shadow-md">
      {item.image_url && (
        <div className="aspect-[4/3] w-full overflow-hidden bg-gold-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget.parentElement as HTMLElement).style.display = "none";
            }}
          />
        </div>
      )}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="font-display text-base font-semibold text-maroon-800">{item.name}</h3>
          {item.description && (
            <p className="mt-1 text-sm text-maroon-700/70">{item.description}</p>
          )}
          {variants && variants.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedId(variant.id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    selectedId === variant.id
                      ? "bg-maroon-700 text-white"
                      : "bg-gold-50 text-maroon-800 ring-1 ring-gold-200"
                  }`}
                >
                  {variant.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-display text-lg font-bold text-gold-600">
            Rs. {price.toLocaleString()}
          </span>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold text-white transition ${
              inStock ? "bg-maroon-700 hover:bg-maroon-800" : "cursor-not-allowed bg-maroon-300"
            }`}
          >
            {inStock ? "Add" : "Out of stock"}
          </button>
        </div>
      </div>
    </div>
  );
}
