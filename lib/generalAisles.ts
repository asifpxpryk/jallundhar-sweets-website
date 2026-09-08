export const GENERAL_AISLES: { slug: string; name: string; image?: string }[] = [
  { slug: "cosmetics", name: "Cosmetics", image: "/general-aisles/cosmetics.png" },
  { slug: "confectionery", name: "Confectionery" },
  { slug: "chocolates", name: "Chocolates" },
  { slug: "cooking", name: "Cooking" },
  { slug: "dry-fruit", name: "Dry Fruit" },
  { slug: "oil-ghee", name: "Oil & Ghee" },
  { slug: "household", name: "Household" },
  { slug: "personal-care", name: "Personal Care" },
  { slug: "baby-care", name: "Baby Care" },
];

export type GeneralAisleSlug = (typeof GENERAL_AISLES)[number]["slug"];

export function isGeneralAisle(value: string): boolean {
  return GENERAL_AISLES.some((aisle) => aisle.slug === value);
}

export function getGeneralAisle(slug: string) {
  return GENERAL_AISLES.find((aisle) => aisle.slug === slug) ?? null;
}
