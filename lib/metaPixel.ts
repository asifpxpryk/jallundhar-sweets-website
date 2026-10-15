declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "1054138490794175";

export type MetaPixelEventParams = {
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: { id: string; quantity: number; item_price?: number }[];
  currency?: string;
  value?: number;
  num_items?: number;
};

export function trackMetaPixel(
  event: string,
  params?: MetaPixelEventParams,
  options?: { eventID?: string }
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (options?.eventID) {
    window.fbq("track", event, sanitizeParams(params), options);
  } else {
    window.fbq("track", event, sanitizeParams(params));
  }
}

export function trackPageView() {
  trackMetaPixel("PageView");
}

export function trackViewContent(params: MetaPixelEventParams) {
  trackMetaPixel("ViewContent", {
    currency: "PKR",
    content_type: "product",
    ...params,
  });
}

export function trackAddToCart(params: MetaPixelEventParams) {
  trackMetaPixel("AddToCart", {
    currency: "PKR",
    content_type: "product",
    ...params,
  });
}

export function trackInitiateCheckout(params: MetaPixelEventParams) {
  trackMetaPixel("InitiateCheckout", { currency: "PKR", ...params });
}

export function trackPurchase(
  params: MetaPixelEventParams,
  options?: { eventID?: string }
) {
  trackMetaPixel("Purchase", { currency: "PKR", ...params }, options);
}

function toNumber(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

/** Meta requires currency as ISO 4217 "PKR" (string) and value as a number. */
function sanitizeParams(params?: MetaPixelEventParams): MetaPixelEventParams {
  if (!params) return {};
  const out: MetaPixelEventParams = { ...params };
  delete out.currency;
  delete out.value;
  if (params.value !== undefined && params.value !== null) {
    const value = toNumber(params.value);
    if (value !== undefined) {
      out.value = value;
      out.currency = "PKR";
    }
  }
  if (params.contents) {
    out.contents = params.contents.map((c) => {
      const item = { ...c, quantity: toNumber(c.quantity) ?? 1 };
      const price = toNumber(c.item_price);
      if (price === undefined) delete item.item_price;
      else item.item_price = price;
      return item;
    });
  }
  if (params.num_items !== undefined) {
    const n = toNumber(params.num_items);
    if (n === undefined) delete out.num_items;
    else out.num_items = n;
  }
  return out;
}