import type { MenuItem } from "@/lib/types";

export const SECTIONS = [
  { slug: "sweets", name: "Sweets", emoji: "🍬", image: "/category-icons/icon-sweets.webp?v=7" },
  { slug: "bakery", name: "Bakery", emoji: "🥐", image: "/category-icons/icon-bakery.webp?v=7" },
  { slug: "snacks", name: "Snacks", emoji: "🍕", image: "/category-icons/icon-snacks.webp?v=7" },
  { slug: "dairy", name: "Dairy", emoji: "🥛", image: "/category-icons/icon-dairy.webp?v=7" },
  { slug: "beverage", name: "Beverage", emoji: "🥤", image: "/category-icons/icon-baverages.webp?v=7" },
  { slug: "general", name: "General", emoji: "🛒", image: "/category-icons/icon-general.webp?v=7" },
] as const;

export type SectionSlug = (typeof SECTIONS)[number]["slug"];

const SNACK_ITEMS = [
  "Egg Boti Pizza Small",
  "Egg Boti Pizza Medium",
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
  "Bar Bq Sandwich",
  "Boti Pizza Small",
  "Boti Pizza Medium",
  "Boti Pizza Large",
  "Cheese Fry Sandwich",
  "Chicken Bread",
  "Chicken Boti",
  "Chicken Burger",
  "Chicken Pizza Small",
  "Chicken Pizza Medium",
  "Chicken Pizza Large",
  "Chicken Patties",
  "Drum Stick",
  "Fried Wing",
  "Imli Chatni",
  "Leg Piece Large",
  "Russian Roll",
  "Shaslik Roll",
  "Shwarma Roll",
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

const SIZE_GROUPS = [
  { id: "cheese-pizza", name: "Cheese Pizza", prefix: "cheese pizza", sizes: ["small", "medium", "large"] },
  { id: "egg-boti-pizza", name: "Egg Boti Pizza", prefix: "egg boti pizza", sizes: ["small", "medium", "large"] },
  { id: "boti-pizza", name: "Boti Pizza", prefix: "boti pizza", sizes: ["small", "medium", "large"] },
  { id: "chicken-pizza", name: "Chicken Pizza", prefix: "chicken pizza", sizes: ["small", "medium", "large"] },
  { id: "plain-bread", name: "Plain Bread", prefix: "plain bread", sizes: ["half", "full"] },
  { id: "milky-bread", name: "Milky Bread", prefix: "milky bread", sizes: ["half", "full"] },
];

function collapseSizeGroup(
  items: MenuItem[],
  group: (typeof SIZE_GROUPS)[number]
): MenuItem[] {
  const isSize = (name: string) =>
    group.sizes.some((size) => normalizeName(name) === `${group.prefix} ${size}`);

  const sizes = items.filter((item) => isSize(item.name));
  if (sizes.length < 2) return items;

  const rest = items.filter((item) => !isSize(item.name));
  const variants = group.sizes
    .map((size) => {
      const match = sizes.find((item) => normalizeName(item.name).endsWith(` ${size}`));
      if (!match) return null;
      return {
        id: match.id,
        label: size.charAt(0).toUpperCase() + size.slice(1),
        price: match.price,
        is_available: match.is_available !== false,
      };
    })
    .filter(
      (v): v is { id: string; label: string; price: number; is_available: boolean } => v !== null
    );

  if (variants.length < 2) return items;

  const defaultVariant =
    variants.find((v) => v.label === "Medium") ??
    variants.find((v) => v.label === "Full") ??
    variants[0];
  const grouped: MenuItem = {
    id: group.id,
    category_id: sizes[0].category_id,
    name: group.name,
    description: sizes.find((s) => s.description)?.description ?? null,
    price: defaultVariant.price,
    image_url: sizes.find((s) => s.image_url)?.image_url ?? null,
    is_available: sizes.some((s) => s.is_available !== false),
    is_hidden: sizes.every((s) => Boolean(s.is_hidden)),
    is_bestseller: sizes.some((s) => Boolean(s.is_bestseller)),
    sort_order: Math.min(...sizes.map((s) => s.sort_order)),
    variants,
  };

  return [grouped, ...rest];
}

export function collapseCheesePizzas(items: MenuItem[]): MenuItem[] {
  return SIZE_GROUPS.reduce((next, group) => collapseSizeGroup(next, group), items);
}
