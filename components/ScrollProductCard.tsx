"use client";

import type { MenuItem } from "@/lib/types";
import { useCart } from "./CartContext";

export default function ScrollProductCard({ item }: { item: MenuItem }) {
  const { add } = useCart();

  return (
    <div className="flex w-40 flex-shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-white shadow-md sm:w-44">
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
        <p className="mt-1 text-sm text-maroon-700/70">Rs. {item.price.toLocaleString()}</p>
        <button
          type="button"
          onClick={() => {
            if (item.is_available === false) return;
            add(item);
          }}
          disabled={item.is_available === false}
          className={`mt-3 w-full rounded-lg py-2 text-xs font-semibold text-white transition ${
            item.is_available === false
              ? "cursor-not-allowed bg-maroon-300"
              : "bg-maroon-800 hover:bg-maroon-900"
          }`}
        >
          {item.is_available === false ? "Out of stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
