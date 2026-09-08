import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const SOURCE = "F:\\Jallundhar\\FOR WEB";
const DEST_DIR = join("public", "products", "pastries");

const MATCHES = [
  { file: "ARCIKA_PASTRY.png", id: "pastry-arcika", dest: "arcika-pastry.jpg" },
  { file: "black_forest_pastry.png", id: "pastry-black-forest", dest: "black-forest-pastry.jpg" },
  { file: "CARAMEL_PASTRY.png", id: "pastry-caramel", dest: "caramel-pastry.jpg" },
  { file: "chocolate_pastry.png", id: "pastry-chocolate", dest: "chocolate-pastry.jpg" },
  { file: "kitkat_PASTRY.png", id: "pastry-kitkat", dest: "kitkat-pastry.jpg" },
  { file: "PINEAPPLE_PASTRY.png", id: "pastry-pineapple", dest: "pineapple-pastry.jpg" },
  { file: "RED_VELVET_PASTRY.png", id: "pastry-red-velvet", dest: "red-velvet-pastry.jpg" },
];

mkdirSync(DEST_DIR, { recursive: true });

const catalogPath = join("data", "menu-items.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const byId = new Map(catalog.map((item) => [item.id, item]));

for (const match of MATCHES) {
  const src = join(SOURCE, match.file);
  const dest = join(DEST_DIR, match.dest);
  await sharp(src).jpeg({ quality: 88, mozjpeg: true }).toFile(dest);
  const item = byId.get(match.id);
  if (!item) {
    console.log("missing menu item", match.id);
    continue;
  }
  item.image_url = `/products/pastries/${match.dest}`;
  console.log("mapped", match.file, "->", item.name, item.image_url);
}

writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const secret =
  process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (url && secret) {
  const supabase = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  for (const match of MATCHES) {
    const image_url = `/products/pastries/${match.dest}`;
    const { error } = await supabase.from("menu_items").update({ image_url }).eq("id", match.id);
    if (error) console.log("supabase fail", match.id, error.message);
    else console.log("supabase ok", match.id);
  }
} else {
  console.log("skip supabase (no admin key)");
}
