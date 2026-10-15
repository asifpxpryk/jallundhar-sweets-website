"use client";

import { useEffect, useRef, useState } from "react";
import { dealPrice } from "@/lib/dealPrice";
import { customerProductName } from "@/lib/productName";
import { trackAddToCart } from "@/lib/metaPixel";
import type { MenuItem } from "@/lib/types";
import { useCart } from "./CartContext";

type Variant = NonNullable<MenuItem["variants"]>[number];

const MAX_QTY = 99;

function withDealPrice(item: MenuItem): MenuItem {
  if (!item.is_deal) return item;
  const sale = dealPrice(item.deal_label);
  if (sale == null || sale === item.price) return item;
  return { ...item, price: sale };
}

export function productLine(item: MenuItem, selected?: Variant): MenuItem {
  const name = customerProductName(
    selected ? `${item.name} (${selected.label})` : item.name,
    item.category_id
  );
  if (!selected) return { ...withDealPrice(item), name };
  return {
    ...item,
    id: selected.id,
    name,
    price: selected.price,
    is_available: selected.is_available !== false,
  };
}

export default function ProductQuantity({
  item,
  selected,
  appearance = "card",
  onCountChange,
}: {
  item: MenuItem;
  selected?: Variant;
  appearance?: "card" | "detail" | "inline";
  onCountChange?: (count: number) => void;
}) {
  const { add, addMany, lines } = useCart();
  const line = productLine(item, selected);
  const inStock = line.is_available !== false;
  const [count, setCount] = useState(0);
  const cartQty = lines.find((entry) => entry.id === line.id)?.quantity ?? 0;
  const cartQtyRef = useRef(cartQty);

  useEffect(() => {
    setCount(0);
  }, [line.id]);

  useEffect(() => {
    const previous = cartQtyRef.current;
    cartQtyRef.current = cartQty;
    if (cartQty < previous) setCount((current) => Math.min(current, cartQty));
  }, [cartQty]);

  useEffect(() => {
    onCountChange?.(count);
  }, [count, onCountChange]);

  function update(delta: number) {
    setCount((current) => Math.min(MAX_QTY, Math.max(0, current + delta)));
  }

  function addToCart() {
    if (!inStock) return;
    const quantity = Math.max(count, 1);
    addMany([{ id: line.id, name: line.name, price: line.price, quantity }]);
    trackAddToCart({
      content_ids: [String(line.id)],
      content_name: line.name,
      value: line.price * quantity,
      contents: [{ id: String(line.id), quantity, item_price: line.price }],
    });
    if (count === 0) setCount(1);
  }

  function addOne() {
    if (!inStock) return;
    add(line);
    trackAddToCart({
      content_ids: [String(line.id)],
      content_name: line.name,
      value: line.price,
      contents: [{ id: String(line.id), quantity: 1, item_price: line.price }],
    });
  }

  if (appearance === "card") {
    if (!inStock) {
      return (
        <button
          type="button"
          disabled
          className="mt-3 min-h-11 w-full cursor-not-allowed rounded-xl bg-maroon-200 px-3 py-2.5 text-sm font-semibold text-maroon-800/70"
        >
          Out of stock
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={addOne}
        aria-label={`Add ${line.name} to cart`}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-maroon-800 px-3 text-[13px] font-semibold text-white shadow-[0_10px_18px_-12px_rgba(74,21,26,0.95)] transition hover:bg-maroon-900 active:translate-y-px sm:text-sm"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 6h15l-1.5 9h-12L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none" />
        </svg>
        Add to cart
      </button>
    );
  }

  if (!inStock) {
    return (
      <button
        type="button"
        disabled
        className={
          appearance === "inline"
            ? "shrink-0 rounded-full bg-maroon-300 px-2.5 py-1 text-xs font-semibold text-white"
            : "mt-3 min-h-11 w-full cursor-not-allowed rounded-lg bg-maroon-300 px-3 py-2.5 text-sm font-semibold text-white"
        }
      >
        Out of stock
      </button>
    );
  }

  const side = appearance === "detail" ? "h-12 w-11 text-lg" : "h-8 w-7 text-sm";
  const label = "Add";

  return (
    <div className="relative shrink-0">
      <div
        className={
          appearance === "detail"
            ? "inline-grid grid-cols-[2.75rem_auto_2.75rem] overflow-hidden rounded-xl bg-maroon-800 text-white"
            : "inline-grid grid-cols-[1.75rem_auto_1.75rem] overflow-hidden rounded-lg bg-maroon-800 text-white"
        }
      >
        <button
          type="button"
          onClick={() => update(-1)}
          disabled={count === 0}
          aria-label={`Decrease ${line.name} quantity`}
          className={`${side} font-semibold transition hover:bg-maroon-900 disabled:cursor-not-allowed disabled:opacity-40`}
        >
          −
        </button>
        <button
          type="button"
          onClick={addToCart}
          aria-label={`Add ${line.name} to cart`}
          className={
            appearance === "inline"
              ? "whitespace-nowrap px-1.5 text-[10px] font-semibold transition hover:bg-maroon-900"
              : "whitespace-nowrap px-3 text-sm font-semibold transition hover:bg-maroon-900"
          }
        >
          {label}
        </button>
        <button
          type="button"
          onClick={() => update(1)}
          aria-label={`Increase ${line.name} quantity`}
          className={`${side} font-semibold transition hover:bg-maroon-900`}
        >
          +
        </button>
      </div>
      {cartQty > 0 ? (
        <span
          aria-live="polite"
          aria-label={`${line.name} quantity ${cartQty}`}
          className="pointer-events-none absolute -right-1 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-[11px] font-bold leading-none text-maroon-900 ring-2 ring-white"
        >
          {cartQty}
        </span>
      ) : null}
    </div>
  );
}
