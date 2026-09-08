export const BEVERAGE_AISLES: { slug: string; name: string; image?: string }[] = [
  { slug: "juices", name: "Juices", image: "/beverage-aisles/juices.png?v=1" },
  { slug: "tea-coffee", name: "Tea & Coffee", image: "/beverage-aisles/tea-coffee.png?v=1" },
  { slug: "chocolate-drinks", name: "Chocolate Drinks", image: "/beverage-aisles/chocolate-drinks.png?v=1" },
  { slug: "powdered-drinks", name: "Powdered Drinks", image: "/beverage-aisles/powdered-drinks.png?v=1" },
  { slug: "squash-syrup", name: "Squash & Syrup", image: "/beverage-aisles/squash-syrup.png?v=1" },
  { slug: "drinking-water", name: "Drinking Water", image: "/beverage-aisles/drinking-water.png?v=1" },
  { slug: "soft-drinks", name: "Soft Drinks & Soda", image: "/beverage-aisles/soft-drinks.png?v=1" },
  { slug: "energy-drinks", name: "Energy Drinks", image: "/beverage-aisles/energy-drinks.png?v=1" },
  { slug: "smoothies", name: "Smoothies", image: "/beverage-aisles/smoothies.png?v=1" },
  { slug: "whiteners-sweetener", name: "Whiteners & Sweetener", image: "/beverage-aisles/whiteners-sweetener.png?v=1" },
];

export type BeverageAisleSlug = (typeof BEVERAGE_AISLES)[number]["slug"];

export function isBeverageAisle(value: string): boolean {
  return BEVERAGE_AISLES.some((aisle) => aisle.slug === value);
}

export function getBeverageAisle(slug: string) {
  return BEVERAGE_AISLES.find((aisle) => aisle.slug === slug) ?? null;
}
