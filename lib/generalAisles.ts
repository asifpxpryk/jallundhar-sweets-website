export const GENERAL_AISLES: { slug: string; name: string; image?: string }[] = [
  { slug: "cosmetics", name: "Cosmetics", image: "/general-aisles/cosmetics.webp?v=3" },
  { slug: "confectionery", name: "Confectionery", image: "/general-aisles/confectionery.webp?v=3" },
  { slug: "chocolates", name: "Chocolates", image: "/general-aisles/chocolates.webp?v=3" },
  { slug: "cooking", name: "Cooking", image: "/general-aisles/cooking.webp?v=3" },
  { slug: "noodles", name: "Noodles", image: "/general-aisles/noodles.webp?v=3" },
  { slug: "snacks", name: "Snacks", image: "/general-aisles/snacks.webp?v=3" },
  { slug: "dry-fruit", name: "Dry Fruit", image: "/general-aisles/dry-fruit.webp?v=3" },
  { slug: "oil-ghee", name: "Oil & Ghee", image: "/general-aisles/oil-ghee.webp?v=3" },
  { slug: "household", name: "Household", image: "/general-aisles/household.webp?v=3" },
  { slug: "personal-care", name: "Personal Care", image: "/general-aisles/personal-care.webp?v=3" },
  { slug: "baby-care", name: "Baby Care", image: "/general-aisles/baby-care.webp?v=3" },
];

export type GeneralAisleSlug = (typeof GENERAL_AISLES)[number]["slug"];

export function isGeneralAisle(value: string): boolean {
  return GENERAL_AISLES.some((aisle) => aisle.slug === value);
}

export function getGeneralAisle(slug: string) {
  return GENERAL_AISLES.find((aisle) => aisle.slug === slug) ?? null;
}
