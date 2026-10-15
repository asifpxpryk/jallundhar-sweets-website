/** A deal line that is only a price, such as "40" or "Rs. 40". Words stay a label. */
export function dealPrice(label: string | undefined | null): number | null {
  if (!label) return null;
  const cleaned = label.trim().replace(/,/g, "").replace(/^rs\.?\s*/i, "");
  if (!/^\d+$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}
