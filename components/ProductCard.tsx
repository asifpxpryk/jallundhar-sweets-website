"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@/lib/types";
import { useCart } from "./CartContext";
import { useIsAdmin } from "./AdminSessionContext";
import { saveStorefrontItem } from "@/app/admin/actions";
import { isSectionSlug, assignSection } from "@/lib/sections";
import ProductImage from "./ProductImage";

function itemSection(item: MenuItem) {
  if (isSectionSlug(item.category_id)) return item.category_id;
  return assignSection(item.name, item.category_id.split(",").filter(Boolean));
}

export default function ProductCard({
  item,
  compact = false,
  priority = false,
  onSaved,
}: {
  item: MenuItem;
  compact?: boolean;
  priority?: boolean;
  onSaved?: () => void;
}) {
  const { add } = useCart();
  const isAdmin = useIsAdmin() && !compact;
  const router = useRouter();
  const variants = item.variants;
  const defaultVariant = variants?.find((v) => v.label === "Medium") ?? variants?.[0];
  const [selectedId, setSelectedId] = useState(defaultVariant?.id ?? item.id);
  const selected = variants?.find((v) => v.id === selectedId);
  const price = selected?.price ?? item.price;
  const inStock = selected ? selected.is_available !== false : item.is_available !== false;
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

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
      className={`flex h-full scroll-mt-24 flex-col overflow-hidden rounded-2xl bg-white shadow-md ${
        compact ? "w-40 flex-shrink-0 snap-start sm:w-44" : "w-full"
      } ${isAdmin && item.is_hidden ? "ring-2 ring-maroon-300" : ""}`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gold-50">
        {item.image_url ? (
          <ProductImage
            src={item.image_url}
            alt={item.name}
            sizes={compact ? "176px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
            className="object-cover"
            priority={priority}
          />
        ) : null}
        {isAdmin && item.is_hidden ? (
          <span className="absolute left-2 top-2 rounded-full bg-maroon-800 px-2 py-0.5 text-[10px] font-semibold text-white">
            Hidden
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3">
        {isAdmin ? (
          <form
            className="flex min-h-0 flex-1 flex-col"
            key={selectedId}
            action={async (formData) => {
              const variant = variants?.find((v) => v.id === selectedId);
              formData.set("id", variant?.id ?? item.id);
              formData.set("catalog_id", item.id);
              formData.set("category_id", itemSection(item));
              formData.set("description", item.description ?? "");
              formData.set("image_url", item.image_url ?? "");
              formData.set("is_hidden", formData.get("is_hidden") ? "true" : "false");
              formData.set("is_out_of_stock", formData.get("is_out_of_stock") ? "true" : "false");
              formData.set("is_bestseller", formData.get("is_bestseller") ? "true" : "false");
              setStatus("saving");
              setError(null);
              const result = await saveStorefrontItem(formData);
              if (result.error) {
                setStatus("error");
                setError(result.error);
                return;
              }
              setStatus("saved");
              onSaved?.();
              router.refresh();
            }}
          >
            <label className="flex min-h-0 flex-1 flex-col text-[11px] text-maroon-800">
              Name
              <textarea
                name="name"
                defaultValue={selected ? `${item.name} ${selected.label}` : item.name}
                rows={4}
                className="mt-0.5 min-h-[4.5rem] w-full flex-1 resize-none rounded-lg border border-gold-200 px-2 py-1.5 font-display text-sm font-semibold leading-tight text-maroon-900"
              />
            </label>
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
            <label className="mt-2 block text-[11px] text-maroon-800">
              Price
              <input
                name="price"
                type="number"
                min="0"
                step="1"
                defaultValue={price}
                className="mt-0.5 w-full rounded-lg border border-gold-200 px-2 py-1 text-sm"
              />
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <label className="flex items-center gap-1.5 text-[11px] text-maroon-800">
                <input
                  name="is_hidden"
                  type="checkbox"
                  defaultChecked={Boolean(item.is_hidden)}
                  className="h-3.5 w-3.5"
                />
                Hide
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-maroon-800">
                <input
                  name="is_out_of_stock"
                  type="checkbox"
                  defaultChecked={!inStock}
                  className="h-3.5 w-3.5"
                />
                Out of stock
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-maroon-800">
                <input
                  name="is_bestseller"
                  type="checkbox"
                  defaultChecked={Boolean(item.is_bestseller)}
                  className="h-3.5 w-3.5"
                />
                Best
              </label>
            </div>
            <button
              type="submit"
              disabled={status === "saving"}
              className={`mt-2 w-full rounded-lg py-1.5 text-[11px] font-semibold text-white ${
                status === "saved"
                  ? "bg-emerald-600"
                  : status === "error"
                    ? "bg-red-700"
                    : "bg-maroon-700"
              }`}
            >
              {status === "saving"
                ? "Saving…"
                : status === "saved"
                  ? "Saved"
                  : status === "error"
                    ? "Retry"
                    : "Save"}
            </button>
            {error ? <p className="text-[11px] text-red-700">{error}</p> : null}
          </form>
        ) : (
          <>
            <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-sm font-semibold leading-tight text-maroon-900">
              {item.name}
            </h3>
            {item.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-maroon-700/70">{item.description}</p>
            ) : null}
            <div className="flex min-h-8 flex-1 items-center">
              {variants && variants.length > 0 ? (
                <div className="flex flex-wrap gap-1">
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
            </div>
            <p className="text-sm text-maroon-700/70">Rs. {price.toLocaleString()}</p>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!inStock}
              className={`mt-3 min-h-11 w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition ${
                inStock ? "bg-maroon-800 hover:bg-maroon-900" : "cursor-not-allowed bg-maroon-300"
              }`}
            >
              {inStock ? "Add to Cart" : "Out of stock"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
