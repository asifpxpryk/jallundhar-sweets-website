import type { MenuItem } from "@/lib/types";

export type BrandChoice = { label: string; count: number };

const OTHER = "Other";

const MULTI_WORD = [
  "nestle pure life",
  "nature's own",
  "natures own",
  "noodle doodle",
  "national foods",
  "mountain dew",
  "choco licious",
  "choco bliss",
  "choco bilss",
  "shan shoop",
  "pure heaven",
  "power plus",
  "mr. noodles",
  "mr noodles",
  "kit kat",
  "dew drop",
  "dairy life",
  "coca-cola",
  "coca cola",
  "blue band",
  "bake parlor",
  "bake time",
  "red bull",
];

const ALIASES: Record<string, string> = {
  aa: "AA",
  "bake parlor": "Bake Parlor",
  "bake time": "Bake Time",
  belco: "Belco",
  besto: "Besto",
  bisconi: "Bisconni",
  bisconni: "Bisconni",
  "blue band": "Blue Band",
  bounty: "Bounty",
  cadbury: "Cadbury",
  cerelac: "Cerelac",
  cerilac: "Cerelac",
  cheetos: "Cheetos",
  "choco bilss": "Choco Bliss",
  "choco bliss": "Choco Bliss",
  "choco licious": "Choco Licious",
  "coca cola": "Coca Cola",
  "coca-cola": "Coca Cola",
  "dairy life": "Dairy Life",
  "dew drop": "Dew Drop",
  ferrero: "Ferrero",
  galaxy: "Galaxy",
  gibs: "GIBS",
  kc: "KC",
  kinder: "Kinder",
  "kit kat": "Kit Kat",
  knorr: "Knorr",
  kolson: "Kolson",
  korneez: "Korneez",
  kurkure: "Kurkure",
  lactogrow: "Lactogrow",
  lagtogrow: "Lactogrow",
  lals: "Lals",
  "lay's": "Lay's",
  lays: "Lay's",
  lindt: "Lindt",
  lu: "LU",
  mars: "Mars",
  mitchells: "Mitchells",
  "mitchell's": "Mitchells",
  mortein: "Mortein",
  mortien: "Mortein",
  "mountain dew": "Mountain Dew",
  "mr noodles": "Mr Noodles",
  "mr. noodles": "Mr Noodles",
  mzmz: "MZMZ",
  national: "National",
  "national foods": "National",
  "noodle doodle": "Noodle Doodle",
  "nature's": "Nature's",
  "nature's own": "Nature's Own",
  natures: "Nature's",
  "natures own": "Nature's Own",
  nestle: "Nestle",
  nestlé: "Nestle",
  "nestle pure life": "Nestle Pure Life",
  noms: "Noms",
  "olper's": "Olper's",
  olpers: "Olper's",
  perk: "Perk",
  pf: "PF",
  "power plus": "Power Plus",
  pringles: "Pringles",
  "pure heaven": "Pure Heaven",
  "red bull": "Red Bull",
  samyang: "Samyang",
  shan: "Shan",
  shangrila: "Shangrila",
  shangrilla: "Shangrila",
  "shan shoop": "Shan Shoop",
  slanty: "Slanty",
  snickers: "Snickers",
  twix: "Twix",
  "young's": "Young's",
  youngs: "Young's",
};

const GENERIC = new Set([
  "akhrot",
  "anjeer",
  "assorted",
  "badam",
  "bite",
  "box",
  "choco",
  "chocolate",
  "classic",
  "cornflour",
  "cup",
  "desi",
  "dried",
  "dry",
  "duck",
  "egg",
  "eggs",
  "extra",
  "family",
  "fresh",
  "full",
  "gift",
  "half",
  "homemade",
  "insecticide",
  "irani",
  "ajwa",
  "kofta",
  "kunafa",
  "large",
  "mini",
  "mixed",
  "chicken",
  "new",
  "noodle",
  "noodles",
  "original",
  "pack",
  "packed",
  "packing",
  "paya",
  "plain",
  "pop",
  "power",
  "premium",
  "qeema",
  "regular",
  "roll",
  "samosa",
  "sauce",
  "sauces",
  "single",
  "small",
  "special",
  "super",
  "sweet",
  "the",
  "traditional",
]);

const MULTI_WORD_PHRASES = [...MULTI_WORD].sort((a, b) => b.length - a.length);

const END_BRANDS = new Set([
  "cadbury",
  "knorr",
  "mitchells",
  "mitchell's",
  "national",
  "nestle",
  "shan",
  "young's",
  "youngs",
]);

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9'.&-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function labelFor(key: string) {
  const alias = ALIASES[key];
  if (alias) return alias;
  return key
    .split(" ")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function isAllCapsName(name: string) {
  const letters = name.replace(/[^A-Za-z]/g, "");
  return letters.length >= 2 && letters === letters.toUpperCase();
}

function firstToken(name: string) {
  return normalize(name).split(" ")[0] ?? "";
}

function hasPackSize(name: string) {
  return /\d+(?:\.\d+)?\s*(?:g|gm|gms|gram|grams|kg|ml|ltr|ltrs|litre|liter|liters|litres|oz)\b/i.test(name);
}

function detectBrand(
  item: Pick<MenuItem, "name" | "company">,
  posAisle: boolean,
  firstCounts: Map<string, number>,
  sized: Set<string>
) {
  const company = item.company?.trim();
  if (company && company !== "Other / unbranded" && company !== OTHER) return company;

  const normalized = normalize(item.name);
  if (!normalized) return null;

  for (const phrase of MULTI_WORD_PHRASES) {
    if (normalized === phrase || normalized.startsWith(`${phrase} `)) return labelFor(phrase);
  }

  const tokens = normalized.split(" ");
  const first = tokens[0] ?? "";
  if (first && !GENERIC.has(first)) {
    if (ALIASES[first]) return ALIASES[first];
    const repeatedPack = (firstCounts.get(first) ?? 0) >= 2 && sized.has(first);
    if (posAisle || repeatedPack) return labelFor(first);
  }

  for (const token of tokens.slice(1)) {
    if (END_BRANDS.has(token)) return labelFor(token);
  }
  return null;
}

export function buildBrandIndex(items: Pick<MenuItem, "name" | "company">[]) {
  const posAisle =
    items.length > 0 && items.filter((item) => isAllCapsName(item.name)).length / items.length >= 0.5;
  const firstCounts = new Map<string, number>();
  const sized = new Set<string>();
  for (const item of items) {
    const token = firstToken(item.name);
    if (!token || GENERIC.has(token)) continue;
    firstCounts.set(token, (firstCounts.get(token) ?? 0) + 1);
    if (hasPackSize(item.name)) sized.add(token);
  }

  const brandOf = (item: Pick<MenuItem, "name" | "company">) =>
    detectBrand(item, posAisle, firstCounts, sized);

  const counts = new Map<string, number>();
  let loose = 0;
  for (const item of items) {
    const brand = brandOf(item);
    if (!brand) loose += 1;
    else counts.set(brand, (counts.get(brand) ?? 0) + 1);
  }

  const singletons = new Set<string>();
  const choices: BrandChoice[] = [];
  for (const [label, count] of counts) {
    if (count <= 1) {
      singletons.add(label);
      loose += count;
    } else {
      choices.push({ label, count });
    }
  }
  choices.sort((a, b) => a.label.localeCompare(b.label, "en"));
  if (loose > 0 && choices.length > 0) choices.push({ label: OTHER, count: loose });

  const choiceFor = (item: Pick<MenuItem, "name" | "company">) => {
    const brand = brandOf(item);
    if (!brand || singletons.has(brand)) return loose > 0 && choices.length > 0 ? OTHER : brand;
    return brand;
  };

  const realBrands = choices.filter((choice) => choice.label !== OTHER).length;
  return {
    choices,
    brandOf,
    choiceFor,
    showBrand: realBrands >= 1 && choices.length >= 2,
  };
}

export function formatProductCount(count: number) {
  const text = Math.max(0, count).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return count === 1 ? "1 product" : `${text} products`;
}
