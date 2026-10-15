"use client";

import { useEffect, useState } from "react";
import { trackAddToCart, trackViewContent } from "@/lib/metaPixel";
import { dealPrice } from "@/lib/dealPrice";
import { customerProductName } from "@/lib/productName";
import { orderUnit } from "@/lib/priceUnit";
import type { MenuItem } from "@/lib/types";
import { useCart } from "./CartContext";
import ProductQuantity, { productLine } from "./ProductQuantity";

export default function SweetProductActions({
  item,
  showSizeNote = false,
}: {
  item: MenuItem;
  showSizeNote?: boolean;
}) {
  const { setLine, openCheckout } = useCart();
  const variants = item.variants;
  const defaultVariant =
    variants?.find((variant) => variant.label === "Medium") ??
    variants?.find((variant) => variant.label === "Full") ??
    variants?.[0];
  const [selectedId, setSelectedId] = useState(defaultVariant?.id ?? item.id);
  const selected = variants?.find((variant) => variant.id === selectedId);
  const price = selected?.price ?? item.price;
  const sale = !selected && item.is_deal ? dealPrice(item.deal_label) : null;
  const showSale = sale != null && sale !== price;
  const shownName = customerProductName(
    selected ? `${item.name} (${selected.label})` : item.name,
    item.category_id
  );
  const unit = orderUnit(selected ? `${item.name} ${selected.label}` : item.name);
  const unitInName = Boolean(unit && shownName.includes(`— ${unit}`));
  const inStock = selected ? selected.is_available !== false : item.is_available !== false;
  const line = productLine(item, selected);
  const [orderQty, setOrderQty] = useState(0);

  useEffect(() => {
    trackViewContent({
      content_ids: [String(item.id)],
      content_name: item.name,
      value: item.price,
    });
  }, [item.id, item.name, item.price]);

  function buyNow() {
    if (!inStock) return;
    const quantity = Math.max(orderQty, 1);
    setLine(line, quantity);
    trackAddToCart({
      content_ids: [String(line.id)],
      content_name: line.name,
      value: line.price * quantity,
      contents: [{ id: String(line.id), quantity, item_price: line.price }],
    });
    openCheckout();
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
      {showSale && sale != null ? (
        <p className="flex flex-wrap items-baseline gap-x-2 font-display leading-none text-maroon-900">
          <span className="text-lg font-semibold text-maroon-700/45 line-through">Rs. {price.toLocaleString()}</span>
          <span className="text-2xl font-bold">Rs. {sale.toLocaleString()}</span>
          {unit && !unitInName ? <span className="text-base font-semibold text-maroon-700/70">for {unit}</span> : null}
        </p>
      ) : (
        <p className="font-display text-2xl font-bold text-maroon-900">
          Rs. {price.toLocaleString()}
          {unit && !unitInName ? <span className="ml-2 text-base font-semibold text-maroon-700/70">for {unit}</span> : null}
        </p>
      )}
      {showSizeNote && !unit ? (
        <p className="mt-3 rounded-xl bg-gold-50 px-3 py-2 text-sm font-medium text-maroon-800">
          Size is not listed on this item. Confirm the pack size on WhatsApp before we dispatch.
        </p>
      ) : null}
      <p className={`mt-1 text-sm ${inStock ? "text-emerald-700" : "text-red-700"}`}>
        {inStock ? "Available" : "Out of stock"}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ProductQuantity item={item} selected={selected} appearance="detail" onCountChange={setOrderQty} />
        {inStock ? (
          <button
            type="button"
            onClick={buyNow}
            className="min-h-12 rounded-xl bg-gold-500 px-6 py-3 text-sm font-semibold text-maroon-900 transition hover:bg-gold-400"
          >
            Buy Now
          </button>
        ) : null}
      </div>
    </div>
  );
}
