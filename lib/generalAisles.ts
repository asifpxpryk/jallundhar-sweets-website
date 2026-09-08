export const GENERAL_AISLES: { slug: string; name: string; image?: string }[] = [
  { slug: "cosmetics", name: "Cosmetics", image: "/general-aisles/cosmetics.png?v=2" },
  { slug: "confectionery", name: "Confectionery", image: "/general-aisles/confectionery.png?v=2" },
  { slug: "chocolates", name: "Chocolates", image: "/general-aisles/chocolates.png?v=2" },
  { slug: "cooking", name: "Cooking", image: "/general-aisles/cooking.png?v=2" },
  { slug: "noodles", name: "Noodles", image: "/general-aisles/noodles.png?v=2" },
  { slug: "snacks", name: "Snacks", image: "/general-aisles/snacks.png?v=2" },
  { slug: "dry-fruit", name: "Dry Fruit", image: "/general-aisles/dry-fruit.png?v=2" },
  { slug: "oil-ghee", name: "Oil & Ghee", image: "/general-aisles/oil-ghee.png?v=2" },
  { slug: "household", name: "Household", image: "/general-aisles/household.png?v=2" },
  { slug: "personal-care", name: "Personal Care", image: "/general-aisles/personal-care.png?v=2" },
  { slug: "baby-care", name: "Baby Care", image: "/general-aisles/baby-care.png?v=2" },
];

export type GeneralAisleSlug = (typeof GENERAL_AISLES)[number]["slug"];

export function isGeneralAisle(value: string): boolean {
  return GENERAL_AISLES.some((aisle) => aisle.slug === value);
}

export function getGeneralAisle(slug: string) {
  return GENERAL_AISLES.find((aisle) => aisle.slug === slug) ?? null;
}
