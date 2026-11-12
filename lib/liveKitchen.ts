/**
 * Live Kitchen menu: types, the built-in default menu, and helpers.
 * The shop edits the real menu in Admin > Live Kitchen; that saved copy replaces these defaults
 * (see lib/liveKitchenStore.ts). This file has no server-only code, so client components can use it.
 */

export type KitchenSize = { key: string; label: string; note?: string; price: number };

export const KITCHEN_TAGS = ["Bestseller", "Spicy", "New"] as const;
export type KitchenTag = (typeof KITCHEN_TAGS)[number];

export type KitchenItem = {
  /** Stable id. The cart line id is `${id}` or `${id}-${size.key}`. */
  id: string;
  name: string;
  description: string;
  /** Single price, used when the item has no sizes. */
  price?: number;
  sizes?: KitchenSize[];
  tag?: KitchenTag;
  /** Real photo (transparent cut-out). Items without one show the drawn illustration. */
  image?: string;
  /** Hidden items stay in the editor but are not shown to customers. */
  hidden?: boolean;
};

export const KITCHEN_GROUP_KEYS = ["pizza", "paratha-roll", "wraps", "sandwich"] as const;
export type KitchenGroupKey = (typeof KITCHEN_GROUP_KEYS)[number];

export type KitchenGroup = {
  key: KitchenGroupKey;
  name: string;
  tagline: string;
  items: KitchenItem[];
};

/** Opening and closing time in Pakistan time, as hours 0–24 (14 = 2 PM, 2 = 2 AM, 23.5 = 11:30 PM). */
export type KitchenHours = { open: number; close: number };

export type KitchenConfig = { hours: KitchenHours; groups: KitchenGroup[] };

export const DEFAULT_KITCHEN_HOURS: KitchenHours = { open: 14, close: 2 };

export const PIZZA_SIZE_TEMPLATE: Omit<KitchenSize, "price">[] = [
  { key: "s", label: "Small", note: '7"' },
  { key: "m", label: "Medium", note: '10"' },
  { key: "l", label: "Large", note: '13"' },
];

const pizzaSizes = (small: number, medium: number, large: number): KitchenSize[] =>
  PIZZA_SIZE_TEMPLATE.map((size, index) => ({ ...size, price: [small, medium, large][index] }));

const DEFAULT_KITCHEN_GROUPS: KitchenGroup[] = [
  {
    key: "pizza",
    name: "Pizza",
    tagline: "Hand-stretched dough, baked to order",
    items: [
      {
        id: "lk-pizza-creamy-tikka",
        name: "Chicken Creamy Tikka Pizza",
        description: "Smoky tikka chicken under a swirl of creamy sauce.",
        sizes: pizzaSizes(550, 1050, 1550),
        tag: "Bestseller",
        image: "/images/live-kitchen/pizza-creamy-tikka.webp",
      },
      {
        id: "lk-pizza-fajita",
        name: "Chicken Fajita Pizza",
        description: "Fajita chicken, capsicum and onion on melted mozzarella.",
        sizes: pizzaSizes(550, 1050, 1550),
        image: "/images/live-kitchen/pizza-fajita.webp",
      },
      {
        id: "lk-pizza-fajita-supreme",
        name: "Chicken Fajita Supreme Pizza",
        description: "Loaded fajita chicken, olives and a smoky sauce drizzle.",
        sizes: pizzaSizes(600, 1150, 1650),
        tag: "Spicy",
        image: "/images/live-kitchen/pizza-fajita-supreme.webp",
      },
      {
        id: "lk-pizza-malai-boti",
        name: "Chicken Malai Boti Pizza",
        description: "Creamy malai boti, mushrooms and capsicum with white sauce.",
        sizes: pizzaSizes(600, 1150, 1650),
        tag: "New",
        image: "/images/live-kitchen/pizza-malai-boti.webp",
      },
      {
        id: "lk-pizza-supreme",
        name: "Chicken Supreme Pizza",
        description: "Chicken chunks, olives, mushrooms and capsicum, extra cheese.",
        sizes: pizzaSizes(650, 1250, 1750),
        image: "/images/live-kitchen/pizza-supreme.webp",
      },
      {
        id: "lk-pizza-kabab",
        name: "Kabab Pizza",
        description: "Whole seekh kababs over spicy chicken, olives and onion.",
        sizes: pizzaSizes(650, 1250, 1750),
        image: "/images/live-kitchen/pizza-kabab.webp",
      },
    ],
  },
  {
    key: "paratha-roll",
    name: "Paratha Rolls",
    tagline: "Flaky paratha, rolled hot off the tawa",
    items: [
      {
        id: "lk-roll-tikka",
        name: "Chicken Tikka Roll",
        description: "Tikka boti, onion and green chutney.",
        price: 320,
        tag: "Bestseller",
        image: "/images/live-kitchen/roll-tikka.webp",
      },
      {
        id: "lk-roll-malai-boti",
        name: "Malai Boti Roll",
        description: "Soft malai boti with garlic mayo.",
        price: 350,
        image: "/images/live-kitchen/roll-malai-boti.webp",
      },
      {
        id: "lk-roll-zinger",
        name: "Zinger Roll",
        description: "Crispy zinger strips, lettuce and spicy mayo.",
        price: 380,
        tag: "Spicy",
        image: "/images/live-kitchen/roll-zinger.webp",
      },
      {
        id: "lk-roll-behari-boti",
        name: "Behari Boti Roll",
        description: "Tender behari boti, onion and mint raita.",
        price: 340,
        image: "/images/live-kitchen/roll-behari-boti.webp",
      },
      {
        id: "lk-roll-mayo-garlic",
        name: "Chicken Mayo Garlic Roll",
        description: "Grilled chicken in a rich mayo garlic sauce.",
        price: 330,
        image: "/images/live-kitchen/roll-mayo-garlic.webp",
      },
    ],
  },
  {
    key: "wraps",
    name: "Wraps",
    tagline: "Toasted tortilla, fresh fillings",
    items: [
      {
        id: "lk-wrap-zinger",
        name: "Zinger Wrap",
        description: "Crispy zinger fillet, lettuce, cheese and chilli sauce.",
        price: 450,
        tag: "Bestseller",
        image: "/images/live-kitchen/wrap-zinger.webp",
      },
      {
        id: "lk-wrap-grilled",
        name: "Grilled Chicken Wrap",
        description: "Grilled chicken, salad and garlic sauce.",
        price: 420,
        image: "/images/live-kitchen/wrap-grilled.webp",
      },
    ],
  },
  {
    key: "sandwich",
    name: "Sandwiches",
    tagline: "Grilled golden, served warm",
    items: [
      {
        id: "lk-sandwich-cheese",
        name: "Chicken Cheese Sandwich",
        description: "Grilled golden with shredded chicken and melted cheddar.",
        price: 480,
        tag: "Bestseller",
        image: "/images/live-kitchen/sandwich-cheese.webp",
      },
      {
        id: "lk-sandwich-grilled",
        name: "Grilled Chicken Sandwich",
        description: "Shredded chicken and green chilli in crisp grilled bread.",
        price: 380,
        image: "/images/live-kitchen/sandwich-grilled.webp",
      },
    ],
  },
];

export const DEFAULT_KITCHEN_CONFIG: KitchenConfig = {
  hours: DEFAULT_KITCHEN_HOURS,
  groups: DEFAULT_KITCHEN_GROUPS,
};

/** Name used on the cart line and in the WhatsApp order message. */
export function kitchenLineName(item: KitchenItem, size?: KitchenSize): string {
  return size ? `${item.name} (${size.label}) · Live Kitchen` : `${item.name} · Live Kitchen`;
}

export function kitchenLineId(item: KitchenItem, size?: KitchenSize): string {
  return size ? `${item.id}-${size.key}` : item.id;
}

function clockLabel(time: number) {
  const hour24 = Math.floor(time) % 24;
  const minutes = Math.round((time - Math.floor(time)) * 60);
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** "2:00 PM – 2:00 AM" */
export function kitchenHoursLabel(hours: KitchenHours): string {
  return `${clockLabel(hours.open)} – ${clockLabel(hours.close)}`;
}

/** Whether the kitchen is open right now, judged in Pakistan time. */
export function isKitchenOpen(hours: KitchenHours, now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const time = (hour % 24) + minute / 60;
  const { open, close } = hours;
  if (open === close) return true; // same time both ends = open all day
  // Hours that run past midnight (2 PM – 2 AM): open late in the day or early the next morning.
  return open < close ? time >= open && time < close : time >= open || time < close;
}

/** Customer view: hidden items and empty groups removed. */
export function visibleKitchenGroups(groups: KitchenGroup[]): KitchenGroup[] {
  return groups
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.hidden) }))
    .filter((group) => group.items.length > 0);
}

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function cleanPrice(value: unknown) {
  const price = Math.round(Number(value));
  return Number.isFinite(price) && price >= 0 && price <= 1_000_000 ? price : 0;
}

function cleanTime(value: unknown, fallback: number) {
  const time = Number(value);
  if (!Number.isFinite(time) || time < 0 || time >= 24) return fallback;
  return Math.round(time * 2) / 2;
}

function cleanImage(value: unknown) {
  const image = cleanText(value, 600);
  return image.startsWith("/") || /^https:\/\//i.test(image) ? image : "";
}

/**
 * Turns anything (saved JSON, editor form) into a safe config.
 * Returns null when it is not a usable menu, so callers fall back to the defaults.
 */
export function parseKitchenConfig(raw: unknown): KitchenConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as { hours?: unknown; groups?: unknown };
  if (!Array.isArray(source.groups)) return null;

  const hoursRaw = (source.hours && typeof source.hours === "object" ? source.hours : {}) as Partial<KitchenHours>;
  const hours: KitchenHours = {
    open: cleanTime(hoursRaw.open, DEFAULT_KITCHEN_HOURS.open),
    close: cleanTime(hoursRaw.close, DEFAULT_KITCHEN_HOURS.close),
  };

  const usedIds = new Set<string>();
  const groups: KitchenGroup[] = [];
  for (const key of KITCHEN_GROUP_KEYS) {
    const match = (source.groups as unknown[]).find(
      (group) => group && typeof group === "object" && (group as { key?: unknown }).key === key
    ) as { name?: unknown; tagline?: unknown; items?: unknown } | undefined;
    const fallback = DEFAULT_KITCHEN_GROUPS.find((group) => group.key === key)!;
    const items: KitchenItem[] = [];
    for (const rawItem of Array.isArray(match?.items) ? (match!.items as unknown[]).slice(0, 60) : []) {
      if (!rawItem || typeof rawItem !== "object") continue;
      const row = rawItem as Record<string, unknown>;
      const name = cleanText(row.name, 80);
      const id = cleanText(row.id, 60);
      if (!name || !/^lk-[a-z0-9-]+$/.test(id) || usedIds.has(id)) continue;
      usedIds.add(id);
      const item: KitchenItem = { id, name, description: cleanText(row.description, 200) };
      if (Array.isArray(row.sizes) && row.sizes.length > 0) {
        item.sizes = PIZZA_SIZE_TEMPLATE.map((size) => {
          const saved = (row.sizes as unknown[]).find(
            (entry) => entry && typeof entry === "object" && (entry as { key?: unknown }).key === size.key
          ) as { price?: unknown } | undefined;
          return { ...size, price: cleanPrice(saved?.price) };
        });
      } else {
        item.price = cleanPrice(row.price);
      }
      if (KITCHEN_TAGS.includes(row.tag as KitchenTag)) item.tag = row.tag as KitchenTag;
      const image = cleanImage(row.image);
      if (image) item.image = image;
      if (row.hidden === true) item.hidden = true;
      items.push(item);
    }
    groups.push({
      key,
      name: cleanText(match?.name, 40) || fallback.name,
      tagline: cleanText(match?.tagline, 80),
      items,
    });
  }
  return { hours, groups };
}
