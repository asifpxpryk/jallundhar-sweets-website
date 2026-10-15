"use client";

import { dealPrice } from "@/lib/dealPrice";
import { customerProductName } from "@/lib/productName";
import { orderUnit } from "@/lib/priceUnit";
import { useRef, useState } from "react";
import Link from "next/link";
import type { MenuItem } from "@/lib/types";
import { useIsAdmin } from "./AdminSessionContext";
import { useCart } from "./CartContext";
import { saveStorefrontItem, addMenuItem } from "@/app/admin/actions";
import { isSectionSlug, assignSection } from "@/lib/sections";
import ProductImage from "./ProductImage";
import ProductQuantity from "./ProductQuantity";
import PlacementFields from "@/app/admin/PlacementFields";
import { withCompressedPhoto } from "@/lib/compressImage";

function itemSection(item: MenuItem) {
  if (isSectionSlug(item.category_id)) return item.category_id;
  return assignSection(item.name, item.category_id.split(",").filter(Boolean));
}

export default function ProductCard({
  item,
  compact = false,
  priority = false,
  onSaved,
  onCancel,
  isNew = false,
  aisleSection,
  aisleSlug,
  shelf,
}: {
  item: MenuItem;
  compact?: boolean;
  priority?: boolean;
  onSaved?: () => void;
  onCancel?: () => void;
  isNew?: boolean;
  aisleSection?: string;
  aisleSlug?: string;
  shelf?: "new" | "deal";
}) {
  const isAdmin = useIsAdmin() && !compact;
  const { lines } = useCart();
  const productHref =
    !isNew && !item.preview_only ? `/product/${encodeURIComponent(item.id)}` : null;
  const variants = item.variants;
  const defaultVariant =
    variants?.find((v) => v.label === "Medium") ??
    variants?.find((v) => v.label === "Full") ??
    variants?.[0];
  const [selectedId, setSelectedId] = useState(defaultVariant?.id ?? item.id);
  const selected = variants?.find((v) => v.id === selectedId);
  const lineId = selected?.id ?? item.id;
  const cartQty = lines.find((entry) => entry.id === lineId)?.quantity ?? 0;
  const price = selected?.price ?? item.price;
  const sale = !selected && item.is_deal ? dealPrice(item.deal_label) : null;
  const showSale = sale != null && sale !== price;
  const shownName = customerProductName(
    selected ? `${item.name} (${selected.label})` : item.name,
    aisleSection || item.category_id
  );
  const unit = orderUnit(selected ? `${item.name} ${selected.label}` : item.name);
  const unitInName = Boolean(unit && shownName.includes(`— ${unit}`));
  const inStock = selected ? selected.is_available !== false : item.is_available !== false;
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [clearedPhoto, setClearedPhoto] = useState(false);
  const [photoMenu, setPhotoMenu] = useState(false);
  const shownPhoto = clearedPhoto ? "" : photoPreview || item.image_url || "";

  return (
    <div
      id={`item-${item.id}`}
      className={`group flex h-full scroll-mt-24 flex-col overflow-hidden rounded-[1.35rem] bg-white shadow-[0_14px_32px_-20px_rgba(74,21,26,0.55)] transition duration-200 sm:hover:-translate-y-0.5 sm:hover:shadow-[0_20px_36px_-18px_rgba(74,21,26,0.5)] ${
        compact ? "w-40 flex-shrink-0 snap-start sm:w-44" : "w-full"
      } ${
        isAdmin && item.is_hidden
          ? "ring-2 ring-maroon-300"
          : cartQty > 0
            ? "ring-2 ring-gold-400"
            : shelf === "new"
              ? "bg-[#fffdf8] ring-2 ring-gold-400"
              : shelf === "deal"
                ? "bg-[#fff7f6] ring-2 ring-maroon-700"
                : "ring-1 ring-gold-100"
      }`}
    >
      <div
        className={`relative aspect-square w-full overflow-hidden ${
          item.preview_only
            ? "bg-white"
            : "bg-[radial-gradient(circle_at_50%_40%,#ffffff_0%,#fdf8ed_72%,#faedc8_140%)]"
        }`}
      >
        {shelf === "new" || shelf === "deal" ? (
          <span
            className={`absolute left-2 top-2 z-[2] rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              shelf === "new" ? "bg-gold-400 text-maroon-900" : "bg-maroon-800 text-white"
            }`}
          >
            {shelf === "new" ? "New" : "Deal"}
          </span>
        ) : null}
        {shownPhoto.startsWith("blob:") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shownPhoto} alt={shownName} className="h-full w-full object-cover" />
        ) : (
          <ProductImage
            src={shownPhoto}
            alt={shownName}
            sizes={compact ? "176px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
            className={item.preview_only && shownPhoto ? "object-contain p-4" : "object-cover"}
            priority={priority}
          />
        )}
        {item.preview_only && item.image_is_illustrative && shownPhoto ? (
          <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-maroon-800 shadow-sm">
            Illustrative image
          </span>
        ) : null}
        {!isAdmin && productHref ? (
          <Link
            href={productHref}
            className="absolute inset-0 z-[1]"
            aria-label={`View ${shownName} details`}
          />
        ) : null}
        {isAdmin ? (
          <>
            <button
              type="button"
              onClick={() => (shownPhoto ? setPhotoMenu((open) => !open) : photoRef.current?.click())}
              className="absolute inset-0 z-[1]"
              aria-label={shownPhoto ? "Change product photo" : "Add product photo"}
            />
            {photoMenu ? (
              <div className="absolute inset-x-2 bottom-2 z-[2] flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoMenu(false);
                    photoRef.current?.click();
                  }}
                  className="rounded-lg bg-maroon-800 px-2 py-1.5 text-[11px] font-semibold text-white"
                >
                  Replace photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setClearedPhoto(true);
                    setPhotoPreview(null);
                    setPhotoMenu(false);
                    if (photoRef.current) photoRef.current.value = "";
                  }}
                  className="rounded-lg bg-red-700 px-2 py-1.5 text-[11px] font-semibold text-white"
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <span className="pointer-events-none absolute bottom-2 left-2 z-[1] rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white">
                Tap photo
              </span>
            )}
          </>
        ) : null}
        {isAdmin && item.is_hidden ? (
          <span className="absolute left-2 top-2 z-[2] rounded-full bg-maroon-800 px-2 py-0.5 text-[10px] font-semibold text-white">
            Hidden
          </span>
        ) : null}
        {!isAdmin && cartQty > 0 ? (
          <span
            aria-live="polite"
            aria-label={`${shownName}, ${cartQty} in cart`}
            className="pointer-events-none absolute right-2.5 top-2.5 z-[2] flex h-8 min-w-8 items-center justify-center rounded-full bg-gold-500 px-1.5 text-sm font-bold leading-none text-maroon-900 shadow-[0_6px_14px_-4px_rgba(74,21,26,0.55)] ring-2 ring-white"
          >
            {cartQty}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col border-t border-gold-100 p-3">
        {isAdmin ? (
          <form
            className="flex min-h-0 flex-1 flex-col"
            key={selectedId}
            action={async (formData) => {
              if (!isNew) {
                const variant = variants?.find((v) => v.id === selectedId);
                formData.set("id", variant?.id ?? item.id);
                formData.set("catalog_id", item.id);
                formData.set(
                  "variant_ids",
                  variants?.map((entry) => entry.id).join(",") ?? ""
                );
                formData.set("image_url", item.image_url ?? "");
              }
              formData.set("description", item.description ?? "");
              formData.set("is_hidden", formData.get("is_hidden") ? "true" : "false");
              formData.set("is_out_of_stock", formData.get("is_out_of_stock") ? "true" : "false");
              formData.set("is_bestseller", formData.get("is_bestseller") ? "true" : "false");
              formData.set("is_new_arrival", formData.get("is_new_arrival") ? "true" : "false");
              formData.set("is_deal", formData.get("is_deal") ? "true" : "false");
              await withCompressedPhoto(formData);
              setStatus("saving");
              setError(null);
              const result = isNew ? await addMenuItem(formData) : await saveStorefrontItem(formData);
              if (result.error) {
                setStatus("error");
                setError(result.error);
                return;
              }
              setStatus("saved");
              onSaved?.();
            }}
          >
            <input
              ref={photoRef}
              name="photo"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setClearedPhoto(false);
                setPhotoPreview(URL.createObjectURL(file));
                setPhotoMenu(false);
              }}
            />
            {clearedPhoto ? <input type="hidden" name="clear_image" value="true" /> : null}
            <label className="flex min-h-0 flex-1 flex-col text-[11px] text-maroon-800">
              Name
              <textarea
                name="name"
                defaultValue={isNew ? "" : selected ? `${item.name} ${selected.label}` : item.name}
                placeholder={isNew ? "Product name" : undefined}
                required={isNew}
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
                defaultValue={isNew ? "" : price}
                placeholder="0"
                required={isNew}
                className="mt-0.5 w-full rounded-lg border border-gold-200 px-2 py-1 text-sm"
              />
            </label>
            <PlacementFields
              compact
              defaultSection={aisleSection || itemSection(item)}
              defaultAisle={aisleSlug}
            />
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
              <label className="flex items-center gap-1.5 text-[11px] text-maroon-800">
                <input
                  name="is_new_arrival"
                  type="checkbox"
                  defaultChecked={Boolean(item.is_new_arrival)}
                  className="h-3.5 w-3.5"
                />
                New
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-maroon-800">
                <input
                  name="is_deal"
                  type="checkbox"
                  defaultChecked={Boolean(item.is_deal)}
                  className="h-3.5 w-3.5"
                />
                Deal
              </label>
            </div>
            <label className="mt-2 block text-[11px] text-maroon-800">
              Deal line
              <input
                name="deal_label"
                maxLength={32}
                defaultValue={item.deal_label ?? ""}
                placeholder="New price, e.g. 40"
                className="mt-0.5 w-full rounded-lg border border-gold-200 px-2 py-1 text-sm"
              />
            </label>
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
            {isNew && onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="mt-1 w-full rounded-lg py-1.5 text-[11px] font-semibold text-maroon-800 ring-1 ring-gold-200"
              >
                Cancel
              </button>
            ) : null}
            {error ? <p className="text-[11px] text-red-700">{error}</p> : null}
          </form>
        ) : (
          <>
            {item.is_deal && item.deal_label && !showSale ? (
              <p className="mb-1 line-clamp-1 text-[11px] font-semibold text-gold-800">{item.deal_label}</p>
            ) : null}
            <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-sm font-semibold leading-snug tracking-tight text-maroon-900">
              {productHref ? (
                <Link href={productHref} className="transition hover:text-maroon-700">
                  {shownName}
                </Link>
              ) : (
                shownName
              )}
            </h3>
            {item.description ? (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-maroon-700/70">{item.description}</p>
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
            <div className="flex items-center justify-between gap-2">
              {showSale && sale != null ? (
                <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 font-display leading-none">
                  <span className="text-xs font-semibold text-maroon-700/45 line-through">Rs. {price.toLocaleString()}</span>
                  <span className="text-[15px] font-bold text-maroon-900">Rs. {sale.toLocaleString()}</span>
                </p>
              ) : (
                <p className="font-display text-[15px] font-bold leading-none text-maroon-900">
                  Rs. {price.toLocaleString()}
                </p>
              )}
              {unit && !unitInName ? (
                <span className="shrink-0 rounded-full bg-gold-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-gold-800 ring-1 ring-gold-200">
                  {unit}
                </span>
              ) : null}
            </div>
            {productHref ? (
              <Link
                href={productHref}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-maroon-700/80 transition hover:text-maroon-900"
              >
                View details
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
            {item.preview_only ? (
              <a
                href={`https://wa.me/923001538440?text=${encodeURIComponent(`Assalam o alaikum, is ${shownName} available?`)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-maroon-800 px-2 py-2 text-center text-xs font-semibold leading-tight text-maroon-800 transition hover:bg-gold-50"
              >
                {item.image_url ? "Ask on WhatsApp" : "Photo coming · Ask on WhatsApp"}
              </a>
            ) : (
              <ProductQuantity item={item} selected={selected} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
