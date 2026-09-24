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
    window.fbq("track", event, params ?? {}, options);
  } else {
    window.fbq("track", event, params ?? {});
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

export function trackPurchase(params: MetaPixelEventParams) {
  trackMetaPixel("Purchase", { currency: "PKR", ...params });
}
