import type { MenuItem } from "@/lib/types";

/**
 * General-store products the POS adds after the aisle lists were made (data/aisle-items.json) arrive with
 * only "general", so they showed on no aisle page. Their aisle is guessed from the name: clear product
 * words first (soap, shampoo, baby...), then the aisle where the shop already keeps that brand.
 * The admin panel's placement still wins over this guess.
 */

const FOOD = /\b(PICKLE|CANDY|LOLLIPOP|JELLY|BISCUITS?|CHOCOLATE|CEREAL|MILK POWDER)\b/;

/** Packed bars the POS lists under general (granola, energy, chikki); checked before the food guard. */
const SNACK_BARS = /\b(GRANOLA|ENERGY BAR|CHAKEE)\b/;

const RULES: [string, RegExp][] = [
  ["baby-care", /\b(BABY|DIAPERS?|PAMPERS|FEEDER|NIPPLE)\b/],
  ["pest-control", /\b(MOSQUITO|MORTEIN|COIL|INSECT|COCKROACH|REPELLENT|TERMITE|RAT)\b/],
  [
    "party-supplies",
    /\b(BIRTHDAY|HBD|BALLOONS?|BALLON|CANDLES?|PARTY (POP|CUP|SPOON|PLATES?|BALLOON)|CAKE TOPPER|SNOW SPRAY|SMOKE POPER|JHALER|BANNER|FLAGS|SPARKLING|GATA CAP|FACE MASK|SASH)\b/,
  ],
  [
    "stationery",
    /\b(PENS?|PENCILS?|MARKERS?|ERASER|SHARPENER|HIGHLIGHTER|RULER|SCALE|GLUE|DIARY|MEMO|CORRECTION|FINELINER|INK|CLAY|DOUBLE TAPE|SHEET DASTA|KOLORTOTS)\b/,
  ],
  [
    "household",
    /\b(DISH ?WASH|VIM|LEMON MAX|SURF|DETERGENT|SUNLIGHT|AIR FRESHENER|ROOM SPRAY|MAX (LARGE )?SCRUB|SPONGE|SHOE (POLISH|SHINE|SHINER)|ALUMINI?UM FOIL|ALUMINIM|BUTTER PAPER|GLASS CLEANER|CELLS?|PKCELL|CAMELION|ALKALINE|BATTERY|TOKRI)\b/,
  ],
  [
    "personal-care",
    /\b(SOAP|SABUN|SHAMPOO|SHMPO|SHMP|CONDITIONER|FACE ?WASH|FW|LOTION|HAIR ?OIL|HAIR ?COLOU?R|HAIR ?DYE|HAIRFALL|TOOTH ?PASTE|TOOTH ?BRUSH|TP|TEETH|FLUORIDE|HAND ?WASH|BODY ?SPRAY|BODY ?WASH|SHOWER ?GEL|DEODORANT|ROLL ON|PERFUME|SHAV(E|ING)|RAZOR|SANITARY|SERUM|MOISTURI[SZ]ING|PETROLEUM JELLY|FACE ?CREAM|BEAUTY ?CREAM|WHITENING|SKIN|ACNE|SUNBLOCK|SUNSCREEN|FAIRNESS|SCRUB|EXFOLIANT|TISSUES?|MOUTH ?WASH|MW|HAIR ?GEL|HAIR ?SPRAY|COLOGNE|TALC|PANTENE|SUNSILK|DOVE|TRESEMME|AXE|HS|CLEAR|LIFEBUOY|DETTOL|SAFEGUARD|LUX|CAPRI|PEARS|GILLETE|GILLETTE|LISTERINE|SENSODYNE|PARODONTAX|MEDICAM|CLOSEUP|COLGATE|BIGEN|GOLDEN PEARL|FAIR LOVELY|ENCHANTEUR|NIVEA|VASELINE|PONDS|GARNIER|VATIKA)\b/,
  ],
];

/** Words too common to stand for a brand on their own. */
const NOT_A_BRAND = new Set(["SUPER", "NEW", "MINI", "BIG", "SMALL", "LARGE", "FRESH", "PARTY", "HAPPY", "THE", "PACK"]);

function words(name: string): string[] {
  return (name.replace(/\r\n/g, "\n").split("\n")[0] ?? "")
    .toUpperCase()
    .replace(/['’]/g, "")
    .replace(/[^A-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

type BrandIndex = Map<string, Map<string, number>>;

/** Leading one- and two-word names of products already in a general aisle, counted per aisle. */
export function buildBrandIndex(placed: Iterable<{ name: string; aisle: string }>): BrandIndex {
  const index: BrandIndex = new Map();
  for (const { name, aisle } of placed) {
    const w = words(name);
    for (const n of [1, 2]) {
      if (w.length < n) continue;
      const key = w.slice(0, n).join(" ");
      let counts = index.get(key);
      if (!counts) index.set(key, (counts = new Map()));
      counts.set(aisle, (counts.get(aisle) ?? 0) + 1);
    }
  }
  return index;
}

export function guessGeneralAisle(item: Pick<MenuItem, "name">, index: BrandIndex): string | null {
  const w = words(item.name);
  const text = ` ${w.join(" ")} `;
  if (SNACK_BARS.test(text)) return "snacks";
  if (!FOOD.test(text)) {
    for (const [aisle, rule] of RULES) if (rule.test(text)) return aisle;
  }
  for (const n of [2, 1]) {
    if (w.length < n) continue;
    if (n === 1 && (w[0].length < 3 || NOT_A_BRAND.has(w[0]))) continue;
    const counts = index.get(w.slice(0, n).join(" "));
    if (!counts) continue;
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const total = ranked.reduce((sum, [, c]) => sum + c, 0);
    // At least 3 products of the brand, 80% of them in one aisle.
    if (total >= 3 && ranked[0][1] / total >= 0.8) return ranked[0][0];
  }
  return null;
}
