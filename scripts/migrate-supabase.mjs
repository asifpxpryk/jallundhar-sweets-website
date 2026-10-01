import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const sourceFile = fs.existsSync(".env.source.local") ? ".env.source.local" : ".env.local";
const sourceEnv = Object.fromEntries(
  fs.readFileSync(sourceFile, "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      return [line.slice(0, separator), line.slice(separator + 1).replace(/^"|"$/g, "")];
    })
);

const sourceUrl = sourceEnv.NEXT_PUBLIC_SUPABASE_URL;
const sourceKey = sourceEnv.SUPABASE_SECRET_KEY;
const targetUrl = process.env.TARGET_SUPABASE_URL;
const targetKey = process.env.TARGET_SUPABASE_SECRET_KEY;
if (!sourceUrl || !sourceKey || !targetUrl || !targetKey) {
  throw new Error("Missing source or target Supabase credentials");
}
if (sourceUrl === targetUrl) throw new Error("Source and target projects must differ");

const options = { auth: { persistSession: false, autoRefreshToken: false } };
const source = createClient(sourceUrl, sourceKey, options);
const target = createClient(targetUrl, targetKey, options);
const bucket = "product-photos";
const oldPhotoBase = `${sourceUrl}/storage/v1/object/public/${bucket}/`;
const newPhotoBase = `${targetUrl}/storage/v1/object/public/${bucket}/`;

async function listFiles(prefix = "") {
  const files = [];
  const folders = [prefix];
  while (folders.length) {
    const folder = folders.pop();
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await source.storage.from(bucket).list(folder, { limit: 100, offset });
      if (error) throw error;
      for (const entry of data) {
        const path = folder ? `${folder}/${entry.name}` : entry.name;
        if (entry.id) files.push({ path, contentType: entry.metadata?.mimetype || "application/octet-stream" });
        else folders.push(path);
      }
      if (data.length < 100) break;
    }
  }
  return files;
}

async function migratePhoto(file) {
  const downloaded = await source.storage.from(bucket).download(file.path);
  if (downloaded.error) throw new Error(`${file.path}: ${downloaded.error.message}`);
  const bytes = Buffer.from(await downloaded.data.arrayBuffer());
  const uploaded = await target.storage.from(bucket).upload(file.path, bytes, {
    contentType: file.contentType,
    upsert: true,
  });
  if (uploaded.error) throw new Error(`${file.path}: ${uploaded.error.message}`);
}

async function loadMenu() {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await source.from("menu_items").select("*").order("sort_order").range(offset, offset + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

async function main() {
  const files = await listFiles();
  const rows = await loadMenu();
  console.log(`Found ${files.length} photos and ${rows.length} menu rows in the source.`);

  for (let index = 0; index < files.length; index += 5) {
    await Promise.all(files.slice(index, index + 5).map(migratePhoto));
    if ((index + 5) % 50 === 0 || index + 5 >= files.length) {
      console.log(`Copied ${Math.min(index + 5, files.length)}/${files.length} photos.`);
    }
  }

  for (let index = 0; index < rows.length; index += 100) {
    const batch = rows.slice(index, index + 100).map((row) => ({
      ...row,
      image_url: row.image_url?.replaceAll(oldPhotoBase, newPhotoBase) ?? null,
      description: row.description?.replaceAll(oldPhotoBase, newPhotoBase) ?? null,
    }));
    const { error } = await target.from("menu_items").upsert(batch, { onConflict: "id" });
    if (error) throw error;
  }
  const { count, error } = await target.from("menu_items").select("*", { count: "exact", head: true });
  if (error) throw error;
  if (count !== rows.length) throw new Error(`Target has ${count} menu rows; expected ${rows.length}`);
  console.log(`Verified ${count} menu rows in the target.`);
}

main().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
});
