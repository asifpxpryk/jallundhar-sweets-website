export const BEVERAGE_AISLES: { slug: string; name: string; image?: string }[] = [
  { slug: "juices", name: "Juices", image: "/beverage-aisles/juices.webp?v=5" },
  { slug: "tea-coffee", name: "Tea & Coffee", image: "/beverage-aisles/tea-coffee.png?v=1" },
  { slug: "chocolate-drinks", name: "Chocolate Drinks", image: "/beverage-aisles/chocolate-drinks.png?v=1" },
  { slug: "powdered-drinks", name: "Powdered Drinks", image: "/beverage-aisles/powdered-drinks.webp?v=5" },
  { slug: "squash-syrup", name: "Squash & Syrup", image: "/beverage-aisles/squash-syrup.webp?v=5" },
  { slug: "drinking-water", name: "Drinking Water", image: "/beverage-aisles/drinking-water.webp?v=5" },
  { slug: "soft-drinks", name: "Soft Drinks", image: "/beverage-aisles/soft-drinks.webp?v=5" },
  { slug: "energy-drinks", name: "Energy Drinks", image: "/beverage-aisles/energy-drinks.webp?v=5" },
  { slug: "smoothies", name: "Smoothies", image: "/beverage-aisles/smoothies.png?v=1" },
  { slug: "whiteners-sweetener", name: "Whiteners & Sweeteners", image: "/beverage-aisles/whiteners-sweetener.png?v=1" },
];

export type BeverageAisleSlug = (typeof BEVERAGE_AISLES)[number]["slug"];

export function isBeverageAisle(value: string): boolean {
  return BEVERAGE_AISLES.some((aisle) => aisle.slug === value);
}

export function getBeverageAisle(slug: string) {
  return BEVERAGE_AISLES.find((aisle) => aisle.slug === slug) ?? null;
}

function beverageKey(name: string) {
  return name
    .toLowerCase()
    .replace(
      /(\d+(?:\.\d+)?)\s*(ltr|liter|litre|litres|liters|l|ml)\b/g,
      (_match, amount: string, unit: string) => `${amount}${unit === "ml" ? "ml" : "l"}`
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** The beverage aisle a drink belongs in, read from its name (used for POS rows that come without an aisle). */
export function beverageAisleFor(name: string): BeverageAisleSlug {
  const value = beverageKey(name);
  if (/\b(water|watter|aquafina)\b/.test(value) && !/coconut/.test(value)) return "drinking-water";
  if (/\b(red bull|monster|sting|gatorade|predator|booster|blitz|blits)\b/.test(value)) return "energy-drinks";
  if (/\b(coffee|coffe|caffee|cafe|latte|mocha|cappuccino|nescafe)\b/.test(value)) return "tea-coffee";
  if (/\b(milk|chocolate|milo|hazelnut|badam zafran|pista zafraan|malai qulfi|kulfa)\b/.test(value)) return "chocolate-drinks";
  if (/\b(stevia|sweetener)\b/.test(value)) return "whiteners-sweetener";
  if (/\b(tang|powder)\b/.test(value)) return "powdered-drinks";
  if (/\b(squash|syrup|sharbat)\b/.test(value)) return "squash-syrup";
  if (/\b(boba|basil seed|smoothie)\b/.test(value)) return "smoothies";
  if (/\b(juice|nectar|nector|fruit|mango|guava|lychee|peach|pineapple|apple|grape|anaar|annar|strawberry|chaunsa|coconut)\b/.test(value) && !/\b(fanta|mirinda|sprite|7up|pepsi|coca cola|mountain dew|gourmet cola)\b/.test(value)) return "juices";
  return "soft-drinks";
}
