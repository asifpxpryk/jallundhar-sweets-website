import rawProducts from "@/data/pos-beverages-raw.json";
import aisleCatalog from "@/data/aisle-items.json";
import { BEVERAGE_AISLES } from "@/lib/beverageAisles";
import type { MenuItem } from "@/lib/types";

type RawProduct = {
  pos_id: string;
  pos_name: string;
  pos_sale_price: string;
};

const companyNames = [
  "Mountain Dew", "Coca Cola", "Red Bull", "Nestle Pure Life", "Pure Heaven",
  "Fruit Jump", "Dayfresh", "Fruitien", "Fresher", "Gourmet", "Quice",
  "Popular", "Pakola", "Nescafe", "Nesfruta", "Olper's", "Glinter",
  "Monster", "Barbican", "Aquafina", "Sprite", "Pepsi", "Fanta", "Mirinda",
  "Sting", "Tops", "Milo", "Gatorade", "Moussy", "Revive",
  "Rani", "Joiner", "Espana", "Co Fresh", "Basil Seed", "S-Hub", "FV",
  "Bigg", "Big", "Next", "Cola Next", "Rango Next", "Fizup", "Tropicanna Slim",
  "Apna Gourmet", "Cappy", "Fruitien", "Frutango", "FunCafe",
  "Fusion", "Gourmet", "Juice Up", "Kashmiran", "Malt 79", "Mega",
  "Nestle", "Predator", "Premium Barbican", "Slice", "Smart", "Star",
  "Tangy", "Tropicanna", "Vivo", "Zera", "Zia Nosh", "Dew Drop",
  "Heaven", "Revive", "Rani", "Quice", "Tops", "Joiner", "Fresher",
];

function normalized(name: string) {
  return name.toLowerCase().replace(/(\d+(?:\.\d+)?)\s*(ltr|liter|litre|litres|liters|l|ml)\b/g, (_match, amount: string, unit: string) => `${amount}${unit === "ml" ? "ml" : "l"}`)
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function companyFor(name: string) {
  const value = normalized(name);
  if (value.startsWith("7up")) return "Pepsi";
  if (/^(apna|gourme|gourmet)/.test(value)) return "Gourmet";
  if (/^(day freash|dayfreash|dayfresh)/.test(value)) return "Dayfresh";
  if (/^(popular|poppular|papular)/.test(value)) return "Popular";
  if (/^(fruit jummp|fruit jump)/.test(value)) return "Fruit Jump";
  if (/^(bigg|big)\b/.test(value)) return "Big";
  if (/^(nestle|nesfruta)/.test(value) && !value.startsWith("nestle pure life")) return "Nestle";
  if (/^olpers/.test(value)) return "Olper's";
  if (/^(heaven|pure heaven)/.test(value)) return "Pure Heaven";
  const known = [...companyNames].sort((a, b) => b.length - a.length).find((company) =>
    value.startsWith(normalized(company))
  );
  if (known) return known;
  return "Other / unbranded";
}

function photoBrand(name: string) {
  return normalized(name).startsWith("7up") ? "7UP" : companyFor(name);
}

function aisleFor(name: string) {
  const value = normalized(name);
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

const localBeverages = Object.entries(aisleCatalog as Record<string, MenuItem[]>)
  .filter(([key]) => key.startsWith("beverage:"))
  .flatMap(([, items]) => items);

const localImages = new Map(localBeverages.filter((item) => item.image_url).map((item) => [normalized(item.name), item.image_url]));
const imageAliases: Record<string, string> = {
  "glinter green apple": "Glinter Green Apple Sparkling Drink Can, 350ml",
  "glinter lychee": "Glinter Lychee Sparkling Drink Can, 350ml",
  "lemon malt 250ml": "Muree Brewery`S Lemon Malt 250ml Bottle",
  "lychee malt 250ml bottle": "Muree Brewery`S Lychee Malt 250ml Bottle",
  "malt 79 250ml": "Muree Brewery`S Malt-79 250ml Bottle",
  "peach malt 250ml": "Muree Brewery`S Peach Malt 250ml Bottle",
};
const verifiedWebImages: Record<string, string> = {
  "7up 1l": "https://d1iv6qgcmtzm6l.cloudfront.net/products/lg_ceLEjzYRXpUpa97773nXYquI9M9lFHdkZTrWbtmn.jpg",
  "7up 500ml": "https://media.naheed.pk/catalog/product/cache/49dcd5d85f0fa4d590e132d0368d8132/1/1/1117155-1.jpg",
  "pepsi 500ml": "https://www.shopaholic.pk/cdn/shop/files/ic-1029352_pepsi_regular_blue_500ml.jpg?v=1736593121",
  "apna gormet lemon up 1l": "https://cdn.bazaar.technology/live/images/product/ca9e3bbe-f66d-4079-bc0b-7effc937e2d2.webp",
  "apna gourme malta 1l": "https://foodpanda.dhmedia.io/image/darkstores/nv-global-catalog/pk/0c642637-9fbd-4b21-8675-9d0734f0d48d.jpg?height=480",
  "apna gourmet cola 1l": "https://cdn.bazaar.technology/live/images/product/0520cc9a-0703-4f05-8141-034d2b6a1308.webp",
  "apna gormay 1.5l": "https://cdn.bazaar.technology/resolution/600x600/live/images/product/00837772-302c-4dc4-8509-2f504d37fea3.webp",
  "apple malt 300ml bottle": "https://cdn.mafrservices.com/pim-content/PAK/media/product/192446/1719385203/192446_main.jpg",
};
const illustrativeWebImages = new Set(["apna gourmet cola 1l", "apna gormay 1.5l", "apple malt 300ml bottle"]);

function packSize(name: string) {
  const value = name.toLowerCase().replace(/(\d+(?:\.\d+)?)\s*(ltr|liter|litre|litres|liters)\b/g, "$1l");
  const match = value.match(/(\d+(?:\.\d+)?)\s*(ml|l)\b/);
  if (!match) return null;
  return match[2] === "l" ? Number(match[1]) * 1000 : Number(match[1]);
}

const flavourWords = ["zero", "mint", "mango", "orange", "apple", "peach", "strawberry", "lychee", "grape", "anaar", "guava", "pineapple", "lemon", "falsa", "chocolate", "vanilla", "coconut"];
function flavours(name: string) {
  const value = normalized(name).replace(/\b(annar|pomegranate)\b/g, "anaar").replace(/\b(strawbery|strawbary)\b/g, "strawberry").replace(/\bfree\b/g, "zero");
  return flavourWords.filter((flavour) => new RegExp(`\\b${flavour}\\b`).test(value));
}

function localPhotoFor(name: string) {
  const key = normalized(name);
  const direct = localImages.get(key) ?? localImages.get(normalized(imageAliases[key] ?? ""));
  if (direct) return { url: direct, illustrative: false };

  const company = photoBrand(name);
  if (company === "Other / unbranded") return null;
  const size = packSize(name);
  const desiredFlavours = flavours(name);
  const wantsCan = /\b(can|cane|tin)\b/i.test(name);
  const candidates = localBeverages.filter((item) =>
    item.image_url && photoBrand(item.name) === company && !/\b(\d+\s*(pieces|pcs)|case|pack)\b/i.test(item.name)
  );
  const ranked = candidates.map((item) => {
    const candidateSize = packSize(item.name);
    const candidateFlavours = flavours(item.name);
    const candidateCan = /\b(can|tin)\b/i.test(item.name);
    const sameSize = size !== null && candidateSize === size;
    const sameFlavour = desiredFlavours.every((flavour) => candidateFlavours.includes(flavour));
    const extraFlavour = candidateFlavours.some((flavour) => !desiredFlavours.includes(flavour));
    return {
      item,
      score: (sameSize ? 8 : size === null ? 0 : -8)
        + (sameFlavour ? 6 : -10) - (extraFlavour ? 5 : 0)
        + (wantsCan === candidateCan ? 3 : -2),
      exact: sameSize && sameFlavour && !extraFlavour && wantsCan === candidateCan,
    };
  }).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || !best.item.image_url) return null;
  return { url: best.item.image_url, illustrative: !best.exact };
}
const previewDraftRows: MenuItem[] = (rawProducts as RawProduct[]).map((product, index) => {
  const aisle = aisleFor(product.pos_name);
  const localPhoto = localPhotoFor(product.pos_name);
  const webPhoto = verifiedWebImages[normalized(product.pos_name)];
  return {
    id: `pos-preview-${product.pos_id}`,
    category_id: "beverage",
    name: product.pos_name.trim().replace(/\s+/g, " "),
    description: null,
    price: Number(product.pos_sale_price),
    image_url: localPhoto && !localPhoto.illustrative ? localPhoto.url : webPhoto ?? localPhoto?.url ?? null,
    image_is_illustrative: localPhoto && !localPhoto.illustrative ? false : webPhoto ? illustrativeWebImages.has(normalized(product.pos_name)) : localPhoto?.illustrative ?? false,
    is_available: true,
    is_hidden: false,
    is_bestseller: false,
    sort_order: 10000 + index,
    company: companyFor(product.pos_name),
    beverage_type: BEVERAGE_AISLES.find((entry) => entry.slug === aisle)?.name ?? "Soft Drinks",
    preview_only: true,
  };
});
const previewCompanyCounts = new Map<string, number>();
for (const item of previewDraftRows) {
  const company = item.company ?? "Other / unbranded";
  previewCompanyCounts.set(company, (previewCompanyCounts.get(company) ?? 0) + 1);
}
const previewRows = previewDraftRows.map((item) =>
  (previewCompanyCounts.get(item.company ?? "") ?? 0) <= 1
    ? { ...item, company: "Other / unbranded" }
    : item
);

const posPriceByName = new Map<string, number>();
for (const item of previewRows) {
  const key = normalized(item.name);
  if (!posPriceByName.has(key)) posPriceByName.set(key, Number(item.price));
}

/** Flat aisle beverage catalog — used to seed /beverage with real clickable SKUs. */
export function beverageAisleCatalogItems(): MenuItem[] {
  return localBeverages.map((item) => ({
    ...item,
    price: Number(item.price),
    is_available: item.is_available !== false,
    is_hidden: Boolean(item.is_hidden),
  }));
}

export function tagBeverageItems(items: MenuItem[], aisle?: string): MenuItem[] {
  return items.map((item) => ({
    ...item,
    company: companyFor(item.name),
    beverage_type: BEVERAGE_AISLES.find((entry) => entry.slug === (aisle ?? aisleFor(item.name)))?.name ?? "Soft Drinks",
  }));
}

/**
 * Merge POS preview fill-ins. Overlapping aisle/menu SKUs get POS sale price
 * (shop truth). Preview-only rows are only added when no same-name product exists.
 */
export function beveragePreviewItems(existing: MenuItem[], aisle?: string, knownProducts: MenuItem[] = existing): MenuItem[] {
  const pricedExisting = existing.map((item) => {
    const posPrice = posPriceByName.get(normalized(item.name));
    return posPrice !== undefined && Number(item.price) !== posPrice
      ? { ...item, price: posPrice }
      : item;
  });
  const knownIds = new Set(knownProducts.map((item) => item.id));
  const names = new Set([...pricedExisting, ...knownProducts].map((item) => normalized(item.name)));
  const added = new Set<string>();
  const previews = previewRows.filter((item) => {
    if (aisle && aisleFor(item.name) !== aisle) return false;
    const key = normalized(item.name);
    if (knownIds.has(item.id) || names.has(key) || added.has(key)) return false;
    added.add(key);
    return true;
  });
  return [...pricedExisting, ...previews];
}
