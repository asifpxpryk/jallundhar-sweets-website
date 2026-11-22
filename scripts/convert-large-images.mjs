// Makes a .webp copy of every product/banner JPG or PNG over 80 KB and records it in lib/webpVersions.json.
// The originals stay (saved menu rows may still point at them); the site swaps to the .webp at render time.
// Usage: node scripts/convert-large-images.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const publicDir = path.join(root, "public");
const LIMIT = 80 * 1024;
const SKIP = /^(pwa|icons?)[\/]|^og-share\.|^favicon|^apple-touch|^logo\./i;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const converted = [];
for (const file of walk(publicDir)) {
  const rel = path.relative(publicDir, file).split(path.sep).join("/");
  if (!/\.(jpe?g|png)$/i.test(rel) || SKIP.test(rel)) continue;
  if (fs.statSync(file).size <= LIMIT) continue;
  const out = file.replace(/\.(jpe?g|png)$/i, ".webp");
  if (!fs.existsSync(out)) await sharp(file).webp({ quality: 80 }).toFile(out);
  converted.push(`/${rel}`);
}
converted.sort();
fs.writeFileSync(path.join(root, "lib", "webpVersions.json"), `${JSON.stringify(converted, null, 1)}\n`);
console.log(`${converted.length} images have a .webp copy`);
