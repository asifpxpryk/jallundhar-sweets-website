"use client";

import type { MenuItem } from "@/lib/types";
import { useCart } from "./CartContext";

export default function ProductCard({ item }: { item: MenuItem }) {
  const { add } = useCart();

  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-gold-100 bg-white shadow-sm transition hover:shadow-md">
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
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-display text-lg font-bold text-gold-600">
          Rs. {item.price.toLocaleString()}
        </span>
        <button
          onClick={() => add(item)}
          className="rounded-full bg-maroon-700 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-maroon-800"
        >
          Add
        </button>
      </div>
      </div>
    </div>
  );
}
