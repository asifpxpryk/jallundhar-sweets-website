export type ShopExteriorText = {
  eyebrow: string;
  heading: string;
  description: string;
  buttonLabel: string;
};

export const DEFAULT_SHOP_EXTERIOR_TEXT: ShopExteriorText = {
  eyebrow: "Shahi Road · Rahim Yar Khan",
  heading: "Come experience Jallundhar",
  description: "Sweets, bakery and café favorites, all under one roof.",
  buttonLabel: "Visit our shop",
};

export function parseShopExteriorText(value: unknown): ShopExteriorText {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_SHOP_EXTERIOR_TEXT;
  const text = value as Partial<ShopExteriorText>;
  return {
    eyebrow: typeof text.eyebrow === "string" ? text.eyebrow.slice(0, 80) : DEFAULT_SHOP_EXTERIOR_TEXT.eyebrow,
    heading: typeof text.heading === "string" ? text.heading.slice(0, 120) : DEFAULT_SHOP_EXTERIOR_TEXT.heading,
    description: typeof text.description === "string" ? text.description.slice(0, 240) : DEFAULT_SHOP_EXTERIOR_TEXT.description,
    buttonLabel: typeof text.buttonLabel === "string" ? text.buttonLabel.slice(0, 50) : DEFAULT_SHOP_EXTERIOR_TEXT.buttonLabel,
  };
}
