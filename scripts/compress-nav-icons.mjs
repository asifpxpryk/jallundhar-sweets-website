import { mkdirSync, readdirSync, writeFileSync } from "fs";
import { join, parse } from "path";
import sharp from "sharp";

async function toWebp(src, dest, size) {
  await sharp(src)
    .resize(size, size, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(dest);
}

const categoryDir = join("public", "category-icons");
for (const file of readdirSync(categoryDir)) {
  if (!/\.(png|jpg|jpeg|webp)$/i.test(file)) continue;
  const dest = join(categoryDir, `${parse(file).name}.webp`);
  await toWebp(join(categoryDir, file), dest, 256);
  console.log("category", dest);
}

const aisleDir = join("public", "general-aisles");
for (const file of readdirSync(aisleDir)) {
  if (!/\.(png|jpg|jpeg|webp)$/i.test(file)) continue;
  const dest = join(aisleDir, `${parse(file).name}.webp`);
  await toWebp(join(aisleDir, file), dest, 256);
  console.log("aisle", dest);
}

const heroUrl =
  "https://cdn.shopify.com/s/files/1/0663/6208/1508/files/IMG_15.webp?v=1741607299";
const heroRes = await fetch(heroUrl);
if (heroRes.ok) {
  mkdirSync(join("public"), { recursive: true });
  const buf = Buffer.from(await heroRes.arrayBuffer());
  await sharp(buf)
    .resize(1280, 720, { fit: "cover" })
    .webp({ quality: 68 })
    .toFile(join("public", "hero.webp"));
  console.log("hero public/hero.webp");
} else {
  console.log("hero skip", heroRes.status);
}
