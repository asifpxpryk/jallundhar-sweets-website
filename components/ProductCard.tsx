"use client";

import { useState } from "react";
import type { MenuItem } from "@/lib/types";
import { useCart } from "./CartContext";

export default function ProductCard({
  item,
  compact = false,
}: {
  item: MenuItem;
  compact?: boolean;
}) {
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
    <div
      id={`item-${item.id}`}
      className={`flex scroll-mt-24 flex-col overflow-hidden rounded-2xl bg-white shadow-md ${
        compact ? "w-40 flex-shrink-0 snap-start sm:w-44" : "w-full"
      }`}
    >
      <div className="aspect-square w-full overflow-hidden bg-gold-50">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-sm font-semibold leading-tight text-maroon-900">
          {item.name}
        </h3>
        {item.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-maroon-700/70">{item.description}</p>
        ) : null}
        {variants && variants.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedId(variant.id)}
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                  selectedId === variant.id
                    ? "bg-maroon-700 text-white"
                    : "bg-gold-50 text-maroon-800 ring-1 ring-gold-200"
                }`}
              >
                {variant.label}
              </button>
            ))}
          </div>
        ) : null}
        <p className="mt-1 text-sm text-maroon-700/70">Rs. {price.toLocaleString()}</p>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inStock}
          className={`mt-3 w-full rounded-lg py-2 text-xs font-semibold text-white transition ${
            inStock ? "bg-maroon-800 hover:bg-maroon-900" : "cursor-not-allowed bg-maroon-300"
          }`}
        >
          {inStock ? "Add to Cart" : "Out of stock"}
        </button>
      </div>
    </div>
  );
}
