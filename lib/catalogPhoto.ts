const COMING_SOON_VISIBLE_AISLES = new Set(["dry-fruit"]);

export function hasCatalogPhoto(item: { image_url?: string | null }) {
  const src = item.image_url ?? "";
  return Boolean(src) && !src.includes("image-coming-soon");
}

export function keepsComingSoonCards(aisleSlug?: string) {
  return Boolean(aisleSlug && COMING_SOON_VISIBLE_AISLES.has(aisleSlug));
}
