import { customerProductName } from "@/lib/productName";

/**
 * Product URLs use a readable slug ("/product/akhroti-sohan-halwa-1-kg") instead of the stored id.
 * The stored id never changes (cart, orders and the POS bridge still use it); only the URL does.
 *
 * - Ids from WooCommerce ("4661"), the admin panel ("item-1788947471186") and the POS ("pos-prd-1161")
 *   are opaque, so their slug is built from the shopper-facing name.
 * - Ids that are already readable ("drinking-water-jallundhar-pure-water-600ml") are kept as the slug,
 *   so those URLs do not move.
 * - SLUG_OVERRIDES fixes readable ids that describe the wrong product.
 *
 * Old URLs keep working: the product page sends them to the slug with a permanent redirect (data/product-legacy-slugs.json),
 * and the product page redirects any other id it can still find.
 */

export const SLUG_OVERRIDES: Record<string, string> = {
  // Stored as "cream-cake-oreo-2-pound" but the product is the Dairy Milk Cake.
  "cream-cake-oreo-2-pound": "dairy-milk-cake-2-pound",
};

export function isOpaqueProductId(id: string) {
  return /^\d+$/.test(id) || /^item-\d+/.test(id) || /^pos-/.test(id) || !/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(id);
}

export function slugify(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
}

/** Depends only on the item itself (never on the page showing it), so every link to a product agrees. */
export function productSlug(item: { id: string; name: string; category_id?: string }) {
  const override = SLUG_OVERRIDES[item.id];
  if (override) return override;
  if (!isOpaqueProductId(item.id)) return item.id;
  // English line only: Urdu names are on the next line and slugify would drop them anyway.
  const english = item.name.replace(/\r\n/g, "\n").split("\n")[0] ?? "";
  const slug = slugify(customerProductName(english, item.category_id || ""));
  return slug || slugify(item.id) || item.id;
}

export function productHref(item: { id: string; name: string; category_id?: string }) {
  return `/product/${productSlug(item)}`;
}
