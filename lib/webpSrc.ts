import webpVersions from "@/lib/webpVersions.json";

const HAS_WEBP = new Set<string>(webpVersions as string[]);

/** Local JPG/PNG that has a smaller .webp copy (scripts/convert-large-images.mjs): use the copy. */
export function preferWebp(src: string): string {
  const [path, query] = src.split("?");
  if (!HAS_WEBP.has(path)) return src;
  const webp = path.replace(/\.(jpe?g|png)$/i, ".webp");
  return query ? `${webp}?${query}` : webp;
}
