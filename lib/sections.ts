import type { MenuItem } from "@/lib/types";

export const SECTIONS = [
  { slug: "sweets", name: "Sweets", emoji: "🍬", image: "/category-icons/icon-sweets.png?v=5" },
  { slug: "bakery", name: "Bakery", emoji: "🥐", image: "/category-icons/icon-bakery.png?v=5" },
  { slug: "snacks", name: "Snacks", emoji: "🍕", image: "/category-icons/icon-snacks.png?v=5" },
  { slug: "dairy", name: "Dairy", emoji: "🥛", image: "/category-icons/icon-dairy.png?v=6" },
  { slug: "beverage", name: "Beverage", emoji: "🥤", image: "/category-icons/icon-baverages.png?v=5" },
  { slug: "general", name: "General", emoji: "🛒", image: "/category-icons/icon-general.png?v=5" },
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

const HIDDEN_ITEMS = [
  "Special Pizza",
  "Cheesy Creamy Pizza",
  "Cheese Lover Pizza",
  "Supreme Pizza",
  "Malai Botti Pizza",
  "Malai Boti Pizza",
  "Fajita Pizza",
  "Tikka Pizza",
  "Green Chilli Pizza",
  "Loaded Fries Small",
];

const HIDDEN_KEYS = HIDDEN_ITEMS.map(normalizeName);

export function isHiddenMenuItem(name: string): boolean {
  const n = normalizeName(name);
  return HIDDEN_KEYS.some((key) => n === key || n.startsWith(`${key} `));
}

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

const CHEESE_PIZZA_SIZES = ["small", "medium", "large"] as const;

export function collapseCheesePizzas(items: MenuItem[]): MenuItem[] {
  const isCheeseSize = (name: string) =>
    /^cheese pizza (small|medium|large)$/.test(normalizeName(name));

  const sizes = items.filter((item) => isCheeseSize(item.name));
  if (sizes.length < 2) return items;

  const rest = items.filter((item) => !isCheeseSize(item.name));
  const variants = CHEESE_PIZZA_SIZES.map((size) => {
    const match = sizes.find((item) => normalizeName(item.name).endsWith(size));
    if (!match) return null;
    return {
      id: match.id,
      label: size.charAt(0).toUpperCase() + size.slice(1),
      price: match.price,
      is_available: match.is_available,
    };
  }).filter(
    (v): v is { id: string; label: string; price: number; is_available?: boolean } => v !== null
  );

  if (variants.length < 2) return items;

  const defaultVariant = variants.find((v) => v.label === "Medium") ?? variants[0];
  const grouped: MenuItem = {
    id: "cheese-pizza",
    category_id: sizes[0].category_id,
    name: "Cheese Pizza",
    description: sizes.find((s) => s.description)?.description ?? null,
    price: defaultVariant.price,
    image_url: sizes.find((s) => s.image_url)?.image_url ?? null,
    is_available: sizes.some((s) => s.is_available !== false),
    sort_order: Math.min(...sizes.map((s) => s.sort_order)),
    variants,
  };

  return [grouped, ...rest];
}
