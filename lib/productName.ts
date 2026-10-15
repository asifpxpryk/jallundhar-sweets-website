import { orderUnit } from "@/lib/priceUnit";

const SMALL_WORDS = new Set(["a", "an", "and", "of", "in", "the", "or", "with"]);

function isHouseMenu(categoryId: string): boolean {
  return categoryId
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .some(
      (part) =>
        part === "sweets" ||
        part === "bakery" ||
        part.includes("sweet") ||
        part.includes("bakery") ||
        part.includes("rusk")
    );
}

/** Drop a trailing variant such as "(Full)" so the pack size can be read from the product name. */
function splitVariant(name: string): { body: string; variant: string } {
  const match = name.match(/^(.*?)\s*(\([^()\n]+\))\s*$/);
  if (!match) return { body: name, variant: "" };
  return { body: match[1].trim(), variant: match[2] };
}

function stripPackUnits(value: string): string {
  let current = value;
  const tails = [
    /\s*\/\s*(?:kgs?|lbs?)\b\s*$/i,
    /\s+per\s+kg\b\s*$/i,
    /\s+\d+(?:\.\d+)?\s*(?:kgs?|gms?|grams?|g|ml|ltrs?|litres?|liters?|lbs?|pounds?|pieces?|pcs|pc)\b\s*$/i,
  ];
  for (let pass = 0; pass < 6; pass += 1) {
    const next = tails
      .reduce((text, pattern) => text.replace(pattern, ""), current)
      .replace(/\s+/g, " ")
      .trim();
    if (next === current) break;
    current = next;
  }
  return current.replace(/[\s|/—-]+$/g, "").trim();
}

function titleCaseShouting(value: string): string {
  let wordIndex = 0;
  return value
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      const hasLetter = /[A-Za-z]/.test(part);
      const next = part
        .split(/([^A-Za-z']+)/)
        .map((token) => {
          if (!/[A-Z]/.test(token) || /[a-z]/.test(token)) return token;
          const lower = token.toLowerCase();
          if (wordIndex > 0 && SMALL_WORDS.has(lower)) return lower;
          return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join("");
      if (hasLetter) wordIndex += 1;
      return next;
    })
    .join("");
}

/**
 * Shopper-facing name for mithai and bakery.
 * "BADAM BARFI /kg" and "ROLL BARFI /kg /Kg" both become "Badam Barfi — 1 kg".
 * General-store names are left as stored.
 */
export function customerProductName(name: string, categoryId = ""): string {
  const raw = name.replace(/\r\n/g, "\n").trim();
  if (!raw) return raw;
  const [first, ...rest] = raw.split("\n");
  const english = first.replace(/\s+/g, " ").trim();
  const { body, variant } = splitVariant(english);
  const slashUnit = /\/\s*(?:kgs?|lbs?)\b/i.test(body);
  if (!isHouseMenu(categoryId) && !slashUnit) return raw.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();

  const unit = orderUnit(body);
  if (body.includes(" — ")) {
    const ready = variant ? `${body} ${variant}` : body;
    const extra = rest.map((line) => line.trim()).filter(Boolean);
    return extra.length ? `${ready} ${extra.join(" ")}` : ready;
  }
  let base = unit ? stripPackUnits(body) : body;
  base = base.replace(/\s+/g, " ").trim();
  if (!base) base = body;
  base = titleCaseShouting(base);
  const titled = unit ? `${base} — ${unit}` : base;
  const withVariant = variant ? `${titled} ${variant}` : titled;
  const extra = rest.map((line) => line.trim()).filter(Boolean);
  return extra.length ? `${withVariant} ${extra.join(" ")}` : withVariant;
}
