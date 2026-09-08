export const SECTIONS = [
  { slug: "sweets", name: "Sweets", emoji: "🍬", image: "/images/sweets-tray.jpg" },
  { slug: "bakery", name: "Bakery", emoji: "🥐", image: "/images/bakery-muffins.png" },
  { slug: "snacks", name: "Snacks", emoji: "🍕", image: "/images/snacks-pizza.png" },
  { slug: "dairy", name: "Dairy", emoji: "🥛", image: "/images/dairy-dahi.png" },
  { slug: "beverage", name: "Beverage", emoji: "🥤" },
  { slug: "general", name: "General", emoji: "🛒" },
] as const;

export type SectionSlug = (typeof SECTIONS)[number]["slug"];

const SNACK_ITEMS = [
  "Egg Boti Pizza Large",
  "Cheese Pizza Small",
  "Cheese Pizza Medium",
  "Cheese Pizza Large",
  "Pizza Slice",
  "Tikka Sandwich",
  "Boti Sandwich",
  "Tikka Pastry 1 pc",
  "Pizza Pastry",
  "Chicken Croissant",
  "Egg Sandwich",
  "Cheese Club Sandwich",
  "Fried Sandwich",
  "Two in one Burger Half",
  "Chicken Boti Burger",
  "Chicken Chapli 1 Pc",
  "Chicken Shami Kabab",
  "Chicken Punch",
  "Chicken Shashlik Stick 4 boti",
  "Chicken Leg Piece",
  "Dhaka Stick",
];

export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const SNACK_KEYS = new Set(SNACK_ITEMS.map(normalizeName));

export function isSnackItem(name: string): boolean {
  return SNACK_KEYS.has(normalizeName(name));
}

export function isSectionSlug(value: string): value is SectionSlug {
  return SECTIONS.some((section) => section.slug === value);
}

export function getSection(slug: string) {
  return SECTIONS.find((section) => section.slug === slug) ?? null;
}

export function assignSection(name: string, categorySlugs: string[] = []): SectionSlug {
  if (isSnackItem(name)) return "snacks";

  const set = new Set(categorySlugs);
  const n = normalizeName(name);

  if (
    set.has("assorted-sweets") ||
    set.has("premium-sweets") ||
    set.has("traditional-sweets") ||
    set.has("premium-sohan-halwa") ||
    /barfi|halwa|laddu|ladu|jaman|cham cham|phaniyan|pairay|mithai|gulab|balu shahi|egg masu/.test(n)
  ) {
    return "sweets";
  }

  if (/yogurt|yoghurt|\bdahi\b|special desi ghee/.test(n) && !/bread/.test(n)) {
    return "dairy";
  }

  if (
    set.has("drinks") ||
    /lassi|beverage|cold drink|juice|tea|coffee|pakola|pepsi|coke|sprite|water bottle/.test(n)
  ) {
    return "beverage";
  }

  if (
    set.has("bakery") ||
    set.has("plain-biscuits") ||
    set.has("premium-biscuits") ||
    set.has("premium-rusk") ||
    set.has("cakes") ||
    set.has("event-cakes") ||
    set.has("premium-dollar-cup-cake") ||
    set.has("premium-dry-cake") ||
    /biscuit|rusk|bread|cake|nimko|namkeen|pakor/.test(n)
  ) {
    return "bakery";
  }

  if (
    set.has("cafe") ||
    set.has("pizza") ||
    set.has("fast-food") ||
    set.has("nashta-refreshment") ||
    set.has("snacks")
  ) {
    return "snacks";
  }

  if (set.has("dairy-essential") && !/bread/.test(n)) return "dairy";

  return "general";
}
