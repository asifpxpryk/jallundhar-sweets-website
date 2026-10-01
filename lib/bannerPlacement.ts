import type { StoreVisibility } from "@/lib/storeVisibility";

export function bannerId(section: string, title: string, aisle?: string): string {
  return [section, aisle, title]
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function bannerPagesFor(
  visibility: Pick<StoreVisibility, "bannerPages">,
  id: string,
  defaultPage: string
): string[] {
  return Object.prototype.hasOwnProperty.call(visibility.bannerPages, id)
    ? visibility.bannerPages[id]
    : [defaultPage];
}

export function bannerShowsOn(
  visibility: Pick<StoreVisibility, "bannerPages">,
  id: string,
  defaultPage: string,
  page: string
): boolean {
  return bannerPagesFor(visibility, id, defaultPage).includes(page);
}
