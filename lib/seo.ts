import { SITE_BRAND, SITE_CITY, SITE_NAME, SITE_PHONE_DISPLAY, SITE_URL } from "@/lib/site";
import type { MenuItem } from "@/lib/types";

/** JSON for a <script type="application/ld+json"> tag, safe against "</script>" in product text. */
export function jsonLdString(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Shared Open Graph fields; a page's own openGraph replaces the layout's, so spread these in. */
export const OG_DEFAULTS = {
  type: "website" as const,
  locale: "en_PK",
  siteName: SITE_NAME,
  images: [{ url: "/og-share.webp", width: 1200, height: 630, alt: SITE_NAME }],
};

/** Absolute https URL for a site-relative or remote asset. */
export function absoluteUrl(path: string): string {
  try {
    return new URL(path, SITE_URL).toString();
  } catch {
    return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  }
}

export function productPath(id: string) {
  return `/product/${encodeURIComponent(id)}`;
}

/**
 * Same product listed under two ids (old WooCommerce id + current slug). The duplicate stays reachable but its
 * canonical points at the primary page and it is left out of the sitemap.
 */
export const PRODUCT_CANONICAL_ALIASES: Record<string, string> = {
  "4740": "plain-bread", // "Plain Bread Full" = "Plain Bread", same price & photo
  "4736": "milky-bread", // "Milky Bread Full" = "Milky Bread", same price & photo
};

export function canonicalProductId(id: string) {
  return PRODUCT_CANONICAL_ALIASES[id] ?? id;
}

/** The price and stock a shopper first sees on the product page (default variant, like SweetProductActions). */
export function displayOffer(item: MenuItem): { price: number; inStock: boolean } {
  const variants = item.variants;
  const variant =
    variants?.find((entry) => entry.label === "Medium") ??
    variants?.find((entry) => entry.label === "Full") ??
    variants?.[0];
  const price = Number(variant?.price ?? item.price);
  const inStock = variant ? variant.is_available !== false : item.is_available !== false;
  return { price: Number.isFinite(price) ? price : 0, inStock };
}

export function formatRs(price: number) {
  return `Rs ${Math.round(price).toLocaleString("en-US")}`;
}

/** A real product photo, not the "image coming soon" placeholder. */
export function productImage(item: Pick<MenuItem, "image_url">): string | null {
  const src = item.image_url?.trim();
  if (!src || /image-coming-soon|placeholder|no-image|noimage/i.test(src)) return null;
  return absoluteUrl(src);
}

/**
 * Feed-only image check. Merchant Center reported "Image not processed" for the ids below; their files load fine
 * on the site, so they are left alone there and only kept out of the feed. GIFs are skipped too (Google often
 * fails to process them; only one catalog photo is a GIF).
 */
export const FEED_EXCLUDED_IDS = new Set<string>([
  "pos-prd-1161", // LIFESTYLE BROWNI CHOCOLATE CHIP: Image not processed (8 Oct 2026)
  "personal-care-lux-soap-rosy-glow-105gm", // LUX SOAP ROSY GLOW 105GM: Image not processed (8 Oct 2026)
  "pos-prd-3536", // DIGESTIVE ZERO SUGAR BISCUIT: image only 93x200 (12 Oct 2026)
]);

export function feedImage(item: Pick<MenuItem, "id" | "image_url">): string | null {
  if (FEED_EXCLUDED_IDS.has(item.id)) return null;
  const image = productImage(item);
  if (!image) return null;
  const path = image.split("?")[0].toLowerCase();
  if (!/\.(jpe?g|png|webp)$/.test(path)) return null;
  return image;
}

export function brandFor(item: Pick<MenuItem, "company">) {
  const company = item.company?.trim();
  if (!company || /other|unbranded/i.test(company)) return SITE_BRAND;
  return company;
}


/** Sections whose products we make ourselves (brand "Jallundhar Sweets" in structured data). */
const OWN_BRAND_SECTIONS = new Set(["sweets", "bakery", "snacks"]);
/** Our own perishable food (return policy: not returnable, see /return-policy). */
const OWN_PERISHABLE_SECTIONS = new Set(["sweets", "bakery", "snacks", "dairy"]);

function explicitCompany(item: Pick<MenuItem, "company">) {
  const company = item.company?.trim();
  return company && !/other|unbranded/i.test(company) ? company : null;
}

/** Brand for Product structured data: the real maker, ours for own sections, otherwise none. */
export function schemaBrand(item: Pick<MenuItem, "company">, sectionSlug: string): string | null {
  return explicitCompany(item) ?? (OWN_BRAND_SECTIONS.has(sectionSlug) ? SITE_BRAND : null);
}

/** Offer-level MerchantReturnPolicy matching ${SITE_URL}/return-policy. */
export function returnPolicyFor(item: Pick<MenuItem, "company">, sectionSlug: string) {
  const base = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "PK",
    merchantReturnLink: `${SITE_URL}/return-policy`,
  };
  if (!explicitCompany(item) && OWN_PERISHABLE_SECTIONS.has(sectionSlug)) {
    return { ...base, returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted" };
  }
  return {
    ...base,
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 3,
    returnMethod: "https://schema.org/ReturnInStore",
    // Returned at the shop with the receipt: no fee charged (see /return-policy).
    returnFees: "https://schema.org/FreeReturn",
  };
}

/** Merchant Center ids are capped at 50 characters; keep long slugs unique with a short hash. */
export function feedId(id: string) {
  if (id.length <= 50) return id;
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return `${id.slice(0, 41)}-${hash.toString(36).padStart(7, "0").slice(0, 8)}`;
}

const SECTION_PHRASE: Record<string, string> = {
  bakery: "fresh bakery item",
  sweets: "traditional mithai",
  snacks: "fresh snack",
  dairy: "dairy product",
  beverage: "drink",
  general: "grocery item",
  celebrations: "celebration gift",
};

export function productTitle(item: MenuItem) {
  const { price } = displayOffer(item);
  const pricePart = price > 0 ? ` – ${formatRs(price)}` : "";
  return `${item.name}${pricePart} | ${SITE_BRAND} ${SITE_CITY}`;
}

export function productDescription(item: MenuItem, sectionSlug?: string) {
  const own = item.description?.replace(/\s+/g, " ").trim();
  if (own) return own;
  const { price } = displayOffer(item);
  const kind = (sectionSlug && SECTION_PHRASE[sectionSlug]) || "item";
  const pricePart = price > 0 ? ` for ${formatRs(price)}` : "";
  return `Buy ${item.name}${pricePart} – ${kind} from ${SITE_NAME}, Shahi Road, ${SITE_CITY}. Order online or on WhatsApp ${SITE_PHONE_DISPLAY} for home delivery in ${SITE_CITY}.`;
}

type SectionSeo = { title: string; description: string };

const SECTION_SEO: Record<string, SectionSeo> = {
  bakery: {
    title: "Bakery in Rahim Yar Khan – Bread, Cake Rusk, Fruit Cake & Biscuits | Jallundhar Sweets",
    description:
      "Buy fresh bakery items in Rahim Yar Khan: bread, cake rusk, fruit cake, dry cakes, cream cakes, biscuits and pastries from Jallundhar Sweets & Bakers, Shahi Road. Order online or on WhatsApp.",
  },
  sweets: {
    title: "Sweets & Mithai in Rahim Yar Khan – Order Online | Jallundhar Sweets & Bakers",
    description:
      "Traditional mithai and sweets in Rahim Yar Khan since 1959: gulab jaman, barfi, sohan halwa, laddu, sugar-free and seasonal sweets from Jallundhar Sweets & Bakers, Shahi Road. Order online or on WhatsApp.",
  },
  snacks: {
    title: "Pizza, Burgers & Snacks in Rahim Yar Khan | Jallundhar Sweets & Bakers",
    description:
      "Fresh pizza, burgers, sandwiches, patties and rolls in Rahim Yar Khan from Jallundhar Sweets & Bakers, Shahi Road. Order online or on WhatsApp for home delivery.",
  },
  dairy: {
    title: "Fresh Dairy in Rahim Yar Khan | Jallundhar Sweets & Bakers",
    description:
      "Fresh yogurt, desi ghee, bread and dairy in Rahim Yar Khan from Jallundhar Sweets & Bakers, Shahi Road. Order online or on WhatsApp for home delivery.",
  },
  beverage: {
    title: "Cold Drinks, Juices & Beverages in Rahim Yar Khan | Jallundhar Sweets & Bakers",
    description:
      "Soft drinks, juices, water, tea, coffee and energy drinks in Rahim Yar Khan from Jallundhar Sweets & Bakers, Shahi Road. Order online or on WhatsApp.",
  },
  general: {
    title: "General Store & Grocery in Rahim Yar Khan | Jallundhar Sweets & Bakers",
    description:
      "Groceries, biscuits, chocolates, cooking essentials and household items in Rahim Yar Khan from Jallundhar Sweets & Bakers, Shahi Road. Order online or on WhatsApp.",
  },
  celebrations: {
    title: "Celebration Gift Boxes in Rahim Yar Khan | Jallundhar Sweets & Bakers",
    description:
      "Baby celebration and gift boxes with sweets in Rahim Yar Khan from Jallundhar Sweets & Bakers, Shahi Road. Order online or on WhatsApp.",
  },
};

export function sectionSeo(slug: string, name: string): SectionSeo {
  return (
    SECTION_SEO[slug] ?? {
      title: `${name} in Rahim Yar Khan | ${SITE_NAME}`,
      description: `Shop ${name.toLowerCase()} in Rahim Yar Khan from ${SITE_NAME}, Shahi Road. Order online or on WhatsApp ${SITE_PHONE_DISPLAY}.`,
    }
  );
}

export function aisleSeo(sectionSlug: string, sectionName: string, aisleName: string): SectionSeo {
  if (sectionSlug === "bakery") {
    return {
      title: `${aisleName} – Bakery in Rahim Yar Khan | ${SITE_NAME}`,
      description: `Buy fresh ${aisleName.toLowerCase()} in Rahim Yar Khan from the ${SITE_NAME} bakery, Shahi Road. Order online or on WhatsApp ${SITE_PHONE_DISPLAY}.`,
    };
  }
  if (sectionSlug === "sweets") {
    return {
      title: `${aisleName} Sweets & Mithai in Rahim Yar Khan | ${SITE_NAME}`,
      description: `${aisleName} mithai and sweets in Rahim Yar Khan from ${SITE_NAME}, Shahi Road. Order online or on WhatsApp ${SITE_PHONE_DISPLAY}.`,
    };
  }
  return {
    title: `${aisleName} in Rahim Yar Khan – ${sectionName} | ${SITE_NAME}`,
    description: `Shop ${aisleName.toLowerCase()} in Rahim Yar Khan from ${SITE_NAME}, Shahi Road. Order online or on WhatsApp ${SITE_PHONE_DISPLAY}.`,
  };
}

const FOOD = "Food, Beverages & Tobacco";
const ITEMS = `${FOOD} > Food Items`;

const AISLE_CATEGORY: Record<string, string> = {
  // bakery
  breads: `${ITEMS} > Bakery > Breads & Buns`,
  rusks: `${ITEMS} > Bakery`,
  "dry-cakes": `${ITEMS} > Bakery > Cakes & Dessert Bars`,
  "cream-cakes": `${ITEMS} > Bakery > Cakes & Dessert Bars`,
  pastries: `${ITEMS} > Bakery > Pastries & Scones`,
  // general store
  confectionery: `${ITEMS} > Candy & Chocolate`,
  chocolates: `${ITEMS} > Candy & Chocolate`,
  biscuits: `${ITEMS} > Bakery > Cookies`,
  "packaged-cakes": `${ITEMS} > Snack Foods > Snack Cakes`,
  "sauces-ketchup-mayo": `${ITEMS} > Condiments & Sauces`,
  noodles: `${ITEMS} > Pasta & Noodles`,
  "ice-cream": `${ITEMS} > Frozen Desserts & Novelties > Ice Cream & Frozen Yogurt`,
  "tea-and-coffee": `${FOOD} > Beverages`,
  "spices-recipe-mixes": `${ITEMS} > Seasonings & Spices`,
  "achar-pickles": `${ITEMS} > Condiments & Sauces > Pickled Fruits & Vegetables`,
  breakfast: `${ITEMS} > Grains, Rice & Cereal > Cereal & Granola`,
  "baking-desserts": `${ITEMS} > Cooking & Baking Ingredients`,
  "butter-cheese-yogurt": `${ITEMS} > Dairy Products`,
  "spreads-honey": `${ITEMS} > Dips & Spreads`,
  "jams-marmalades": `${ITEMS} > Dips & Spreads > Jams & Jellies`,
  "oil-ghee": `${ITEMS} > Cooking & Baking Ingredients > Cooking Oils`,
  cooking: `${ITEMS} > Cooking & Baking Ingredients`,
  "dry-fruit": `${ITEMS} > Nuts & Seeds`,
  "milk-cream": `${FOOD} > Beverages > Milk`,
  eggs: `${ITEMS} > Meat, Seafood & Eggs > Eggs`,
  "canned-jarred-food": `${ITEMS}`,
  "frozen-ready-to-cook": `${ITEMS} > Prepared Foods`,
  snacks: `${ITEMS} > Snack Foods`,
  "pest-control": "Home & Garden > Household Supplies > Pest Control",
  household: "Home & Garden > Household Supplies",
  "personal-care": "Health & Beauty > Personal Care",
  cosmetics: "Health & Beauty > Personal Care > Cosmetics",
  "baby-care": "Baby & Toddler",
  "baby-food-formula": "Baby & Toddler > Nursing & Feeding > Baby & Toddler Food",
  // beverages
  juices: `${FOOD} > Beverages > Juice`,
  "soft-drinks": `${FOOD} > Beverages > Soda`,
  "energy-drinks": `${FOOD} > Beverages > Sports & Energy Drinks`,
  "drinking-water": `${FOOD} > Beverages > Water`,
  "powdered-drinks": `${FOOD} > Beverages > Powdered Beverage Mixes`,
  "squash-syrup": `${FOOD} > Beverages > Fruit Flavored Drinks`,
  "tea-coffee": `${FOOD} > Beverages`,
  "chocolate-drinks": `${FOOD} > Beverages > Hot Chocolate`,
};

const SECTION_CATEGORY: Record<string, string> = {
  bakery: `${ITEMS} > Bakery`,
  sweets: `${ITEMS} > Candy & Chocolate`,
  snacks: `${ITEMS} > Prepared Foods`,
  dairy: `${ITEMS} > Dairy Products`,
  beverage: `${FOOD} > Beverages`,
  general: `${ITEMS}`,
  celebrations: `${ITEMS} > Food Gift Baskets`,
};

/** Google product taxonomy path for a site section / aisle. */
export function googleProductCategory(sectionSlug: string, aisleSlug?: string): string {
  if (sectionSlug === "bakery") {
    // Everything sold by the bakery stays under Bakery, even the biscuits aisle.
    if (aisleSlug === "biscuits") return `${ITEMS} > Bakery > Cookies`;
    return (aisleSlug && AISLE_CATEGORY[aisleSlug]?.startsWith(`${ITEMS} > Bakery`) && AISLE_CATEGORY[aisleSlug]) || `${ITEMS} > Bakery`;
  }
  if (sectionSlug === "sweets" || sectionSlug === "snacks" || sectionSlug === "dairy" || sectionSlug === "celebrations") {
    return SECTION_CATEGORY[sectionSlug];
  }
  return (aisleSlug && AISLE_CATEGORY[aisleSlug]) || SECTION_CATEGORY[sectionSlug] || ITEMS;
}

/**
 * Merchant Center reads "Brewery" / "Malt" / "Beer" in a title as alcohol. Murree Brewery, Barbican etc. sell
 * non-alcoholic malt and soft drinks in Pakistan, so the feed spells that out. Feed only: site names are untouched.
 */
const NON_ALCOHOLIC_CATEGORY = "Food, Beverages & Tobacco > Beverages > Soda"; // Google taxonomy id 2628
const ALCOHOL_LOOKALIKE = /\b(malt|brew|brewery|beer|barley)\b/i;
// Only treated as non-alcoholic when the name itself says so (e.g. "Champagne Sparkling Juice, Non-Alcoholic").
const WINE_LOOKALIKE = /\b(wine|champagne|cider|shandy)\b/i;
const SAYS_NON_ALCOHOLIC = /non[- ]?alcoholic|alcohol[- ]free|0\.0\s*%|sparkling (juice|drink)/i;
const NOT_A_DRINK_OF_CONCERN = /cocoa|chocolate|ovaltine|milo|horlicks|vinegar|porridge/i;
const PACK_SIZE = /\s*,?\s*\b(?:can|bottle|pet|tin|\d+(?:\.\d+)?\s*(?:ml|ltr|litre|liter|l))\b/i;

export type FeedOverride = { title: string; description: string; category: string; productType: string; brand: string };

export function nonAlcoholicOverride(item: Pick<MenuItem, "name" | "description">, sectionSlug: string): FeedOverride | null {
  if (sectionSlug !== "beverage") return null;
  const name = item.name;
  const lookalike = ALCOHOL_LOOKALIKE.test(name) || (WINE_LOOKALIKE.test(name) && SAYS_NON_ALCOHOLIC.test(name));
  if (!lookalike || NOT_A_DRINK_OF_CONCERN.test(name)) return null;
  const isMalt = /\b(malt|beer|barley)\b/i.test(name);
  const phrase = isMalt
    ? /\bmalt drink\b/i.test(name) ? "(Non-Alcoholic)" : "Non-Alcoholic Malt Drink"
    : /\b(drink|juice)\b/i.test(name) ? "(Non-Alcoholic)" : "Non-Alcoholic Soft Drink";

  let title = name
    .replace(/\bMuree\b/gi, "Murree")
    // "Brewery" alone keeps tripping Google's alcohol classifier; the drinks are sold as "Murree ...".
    .replace(/\bBrewery(?:\s*[`'’]\s*s)?\b/gi, "")
    .replace(/\s*,?\s*\bNon[- ]?Alcoholic\b\s*,?/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const size = title.match(PACK_SIZE);
  if (size && size.index !== undefined && size.index > 0) {
    const head = title.slice(0, size.index).replace(/[\s,]+$/, "");
    const tail = title.slice(size.index).replace(/^[\s,]+/, "");
    title = `${head} ${phrase} ${tail}`;
  } else {
    title = `${title} ${phrase}`;
  }
  title = title.replace(/\s*,\s*/g, ", ").replace(/\s+/g, " ").trim();

  const lead = isMalt
    ? "Non-alcoholic (0.0% alcohol) malt beverage. Contains no alcohol – a carbonated malt-flavoured soft drink."
    : "Non-alcoholic (0.0% alcohol) soft drink. Contains no alcohol.";
  const description = `${lead} ${title}. Sold by ${SITE_NAME}, Shahi Road, ${SITE_CITY}. Order online or on WhatsApp ${SITE_PHONE_DISPLAY}.`;
  const brand = /^murree\b/i.test(title) ? "Murree" : /^barbican\b/i.test(title) ? "Barbican" : SITE_BRAND;
  return {
    title,
    description,
    category: NON_ALCOHOLIC_CATEGORY,
    productType: isMalt ? "Beverages > Non-Alcoholic Malt Drinks" : "Beverages > Non-Alcoholic Soft Drinks",
    brand,
  };
}
