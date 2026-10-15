export const GENERAL_AISLES: { slug: string; name: string; image?: string }[] = [
  { slug: "confectionery", name: "Confectionery", image: "/general-aisles/confectionery.webp?v=3" },
  { slug: "biscuits", name: "Biscuits", image: "/general-aisles/biscuits-400-v1.webp" },
  { slug: "sauces-ketchup-mayo", name: "Sauces, Ketchup & Mayo", image: "/general-aisles/sauces-ketchup-mayo-400-v1.webp" },
  { slug: "noodles", name: "Noodles & Pasta", image: "/general-aisles/noodles.webp?v=3" },
  { slug: "ice-cream", name: "Ice Cream", image: "/general-aisles/ice-cream-400-v1.webp" },
  { slug: "tea-and-coffee", name: "Tea & Coffee", image: "/general-aisles/tea-and-coffee-400-v1.webp" },
  { slug: "spices-recipe-mixes", name: "Spices & Recipe Mixes", image: "/general-aisles/spices-recipe-mixes-400-v1.webp" },
  { slug: "achar-pickles", name: "Achar & Pickles", image: "/general-aisles/achar-pickles-400-v1.webp" },
  { slug: "breakfast", name: "Breakfast", image: "/general-aisles/breakfast-400-v1.webp" },
  { slug: "baking-desserts", name: "Baking & Desserts", image: "/general-aisles/baking-desserts-400-v1.webp" },
  { slug: "butter-cheese-yogurt", name: "Butter, Cheese & Yogurt", image: "/general-aisles/butter-cheese-yogurt-400-v1.webp" },
  { slug: "spreads-honey", name: "Spreads & Honey", image: "/general-aisles/spreads-honey-400-v1.webp" },
  { slug: "packaged-cakes", name: "Packaged Cakes", image: "/general-aisles/packaged-cakes-400-v1.webp" },
  { slug: "jams-marmalades", name: "Jams & Marmalades", image: "/general-aisles/jams-marmalades-400-v1.webp" },
  { slug: "oil-ghee", name: "Cooking Oil & Ghee", image: "/general-aisles/oil-ghee-400-v1.webp" },
  { slug: "dry-fruit", name: "Dry Fruit", image: "/general-aisles/dry-fruit.webp?v=3" },
  { slug: "milk-cream", name: "Milk & Cream", image: "/general-aisles/milk-cream-400-v1.webp" },
  { slug: "pest-control", name: "Pest Control", image: "/general-aisles/pest-control-400-v1.webp" },
  { slug: "baby-food-formula", name: "Baby Food & Formula", image: "/general-aisles/baby-food-formula-400-v1.webp" },
  { slug: "canned-jarred-food", name: "Canned & Jarred Food", image: "/general-aisles/canned-jarred-food-400-v1.webp" },
  { slug: "eggs", name: "Eggs", image: "/general-aisles/eggs-400-v1.webp" },
  { slug: "frozen-ready-to-cook", name: "Frozen & Ready to Cook", image: "/general-aisles/frozen-ready-to-cook-400-v1.webp" },
  { slug: "chocolates", name: "Chocolates", image: "/general-aisles/chocolates.webp?v=3" },
  { slug: "snacks", name: "Snacks", image: "/general-aisles/snacks.webp?v=3" },
  { slug: "cooking", name: "Cooking", image: "/general-aisles/cooking.webp?v=3" },
  { slug: "cosmetics", name: "Cosmetics", image: "/general-aisles/cosmetics.webp?v=3" },
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
