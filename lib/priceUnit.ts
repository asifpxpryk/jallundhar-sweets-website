/** Pack size written into the product name, for example "/kg" or "500g". */
export function orderUnit(name: string): string | null {
  const n = name.toLowerCase().replace(/\s+/g, " ");
  if (/\/\s*kg\b|\bper\s*kg\b/.test(n)) return "1 kg";
  const kg = n.match(/\b(\d+(?:\.\d+)?)\s*kg\b/);
  if (kg) return `${kg[1]} kg`;
  const grams = n.match(/\b(\d+(?:\.\d+)?)\s*(g|gm|gram|grams)\b/);
  if (grams) return `${grams[1]} g`;
  const ml = n.match(/\b(\d+(?:\.\d+)?)\s*ml\b/);
  if (ml) return `${ml[1]} ml`;
  const litres = n.match(/\b(\d+(?:\.\d+)?)\s*(ltr|litre|liter|liters|litres)\b/);
  if (litres) return `${litres[1]} L`;
  const pounds = n.match(/\b(\d+(?:\.\d+)?)\s*(pound|pounds|lb|lbs)\b/);
  if (pounds) return `${pounds[1]} pound`;
  if (/\/\s*lb\b/.test(n)) return "1 lb";
  const pieces = n.match(/\b(\d+)\s*(piece|pieces|pcs|pc)\b/);
  if (pieces) return Number(pieces[1]) === 1 ? "1 piece" : `${pieces[1]} pieces`;
  return null;
}
