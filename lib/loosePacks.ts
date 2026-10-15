import type { MenuCategory, MenuItem } from "@/lib/types";

/** Pack price from the per-kg rate: plus 15%, scaled to the pack weight, then up to the next 10. */
export function loosePackPrice(perKg: number, grams = 250) {
  const raw = Math.round((perKg * 115 * grams) / 100000);
  return Math.ceil(raw / 10) * 10;
}

export const LOOSE_PACK_SECTION = {
  slug: "dry-fruits-masala",
  name: "Dry Fruits & Masala Jaat",
  href: "/dry-fruits-masala",
};

type Rate = { name: string; perKg: number; grams?: number };

const SPICES: Rate[] = [
  { name: "Coriander (Dhaniya)", perKg: 620 },
  { name: "Black Cumin (Kala Zeera)", perKg: 3200 },
  { name: "Cumin (Zeera)", perKg: 1150 },
  { name: "Black Pepper", perKg: 2500 },
  { name: "White Pepper", perKg: 2600 },
  { name: "Green Cardamom", perKg: 12000, grams: 100 },
  { name: "Cloves", perKg: 3200 },
  { name: "Cinnamon", perKg: 850 },
  { name: "Star Anise (Badiyan Phool)", perKg: 1200 },
  { name: "Black Cardamom", perKg: 6600 },
  { name: "Nutmeg (Jaifal)", perKg: 2000 },
  { name: "Mace (Javitri)", perKg: 8200 },
  { name: "Dry Ginger (Sonth)", perKg: 1200 },
  { name: "Fennel (Saunf)", perKg: 800 },
  { name: "Carom Seeds (Ajwain)", perKg: 400 },
  { name: "Red Chilli Powder", perKg: 650 },
  { name: "Crushed Red Chilli (Mirch Kutar)", perKg: 650 },
  { name: "Turmeric Powder", perKg: 650 },
];

const DRY_FRUITS: Rate[] = [
  { name: "Dried Figs (Anjeer)", perKg: 2400 },
  { name: "Walnuts", perKg: 1200 },
  { name: "Walnut Kernels", perKg: 2200 },
  { name: "Pistachios, Salted", perKg: 4700 },
  { name: "Pistachio Kernels", perKg: 8400 },
  { name: "Cashews, Plain", perKg: 3200 },
  { name: "Cashews, Salted", perKg: 3500 },
  { name: "Almond Kernels", perKg: 3300 },
  { name: "Basra Dates", perKg: 400 },
  { name: "Muzafati Dates", perKg: 650 },
  { name: "Iranian Dates", perKg: 460 },
  { name: "Raisins (Kishmish)", perKg: 1020 },
  { name: "Raisins, Kandhari", perKg: 1000 },
  { name: "Raisins, Sundar Khani", perKg: 1100 },
  { name: "Fox Nuts (Phool Makhana)", perKg: 4400 },
  { name: "Sunflower Seeds", perKg: 800 },
  { name: "Pumpkin Seeds", perKg: 1800 },
  { name: "Dry Dates (Chhuhara)", perKg: 350 },
  { name: "Dry Coconut, India (Khopra)", perKg: 1000 },
  { name: "Desiccated Coconut (Khopra Burada)", perKg: 1000 },
  { name: "Dried Apricots", perKg: 750 },
  { name: "Rock Sugar (Misri)", perKg: 300 },
  { name: "White Sesame, Silky", perKg: 600 },
  { name: "Black Sesame", perKg: 850 },
  { name: "Chickpeas (Chanay)", perKg: 540 },
  { name: "Sago (Sagudana)", perKg: 420 },
  { name: "Poppy Seeds (Khashkhash)", perKg: 750 },
  { name: "Dried Plums, Iranian (Aloo Bukhara)", perKg: 1400 },
  { name: "Baking Soda (Meetha Soda)", perKg: 140 },
  { name: "Dried Pomegranate Seeds (Anar Dana)", perKg: 700 },
  { name: "Corn Flour", perKg: 180 },
  { name: "Flaxseed, Ukraine (Alsi)", perKg: 500 },
  { name: "Stone Chocolate", perKg: 1700 },
  { name: "Chia Seeds", perKg: 1250 },
  { name: "Mixed Dry Fruit", perKg: 3000 },
  { name: "Melon Seeds (Magaz Tarbooz)", perKg: 1000 },
  { name: "Filter Dana", perKg: 680 },
  { name: "White Oats", perKg: 800 },
  { name: "Barley Porridge", perKg: 600 },
  { name: "Jumbo Rolled Oats", perKg: 820 },
  { name: "Wheat Porridge", perKg: 500 },
  // Listed at Rs 180 per 200g, which is Rs 900 per kg.
  { name: "Bread Crumbs", perKg: 900 },
];

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toItems(aisle: string, rows: Rate[]): MenuItem[] {
  return rows.map((row, index) => ({
    id: `pack-${aisle}-${slug(row.name)}`,
    category_id: LOOSE_PACK_SECTION.slug,
    name: `${row.name} — ${row.grams ?? 250} g`,
    description: null,
    price: loosePackPrice(row.perKg, row.grams ?? 250),
    image_url: `/products/loose-packs/${aisle}/${slug(row.name)}-v3.webp`,
    is_available: true,
    sort_order: index,
    search_aisle: aisle,
  }))
    // Retain the original rate data while hiding the unidentified product.
    .filter((item) => item.id !== "pack-dry-fruits-filter-dana");
}

export const LOOSE_PACK_AISLES = [
  {
    slug: "dry-fruits",
    name: "Dry Fruits & Nuts",
    href: "/dry-fruits-masala/dry-fruits",
    image: "/loose-packs/banners/dry-fruits-v1.webp",
    items: toItems("dry-fruits", DRY_FRUITS),
  },
  {
    slug: "masala-jaat",
    name: "Masala Jaat",
    href: "/dry-fruits-masala/masala-jaat",
    image: "/loose-packs/banners/masala-v1.webp",
    items: toItems("masala-jaat", SPICES),
  },
] as const;

export function loosePackAisle(slug: string) {
  return LOOSE_PACK_AISLES.find((aisle) => aisle.slug === slug) ?? null;
}

export function findLoosePack(id: string) {
  for (const aisle of LOOSE_PACK_AISLES) {
    const item = aisle.items.find((entry) => entry.id === id);
    if (!item) continue;
    return {
      item,
      section: LOOSE_PACK_SECTION,
      aisle: { name: aisle.name, href: aisle.href },
      siblings: aisle.items as unknown as MenuItem[],
    };
  }
  return null;
}

export function looseSearchCategories(): MenuCategory[] {
  return LOOSE_PACK_AISLES.map((aisle, index) => ({
    id: aisle.slug,
    slug: aisle.slug,
    name: aisle.name,
    sort_order: 100 + index,
    items: aisle.items as unknown as MenuItem[],
  }));
}
