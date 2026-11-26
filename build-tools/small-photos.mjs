/**
 * Runs before `next build`: makes the small copy of every product photo once and ships it as a plain
 * file (public/small-photo/p/<file name>.webp), so lists never wake a server function for a photo.
 *
 * The copies are kept in .next/cache/small-photos, which stays from one build to the next, so a
 * build only downloads and resizes photos it has not seen. A photo added after the build is still made
 * on request by /api/small-photo (see next.config.mjs) until the next build picks it up.
 *
 * Nothing here may fail the build: a photo that can't be made is simply left to that route.
 * Keep WIDTH and QUALITY equal to lib/smallPhoto.ts.
 */
import { copyFile, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";

const WIDTH = 400;
const QUALITY = 72;
const BUCKET_PATH = "/storage/v1/object/public/product-photos/";
const FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/;
const MAX_SOURCE_BYTES = 6 * 1024 * 1024;
const FETCH_WAIT_MS = 15_000;
const AT_ONCE = 12;
/** New photos stop being made after this long; the rest are made on request. */
const TIME_LIMIT_MS = 6 * 60_000;

const root = process.cwd();
const cacheDir = path.join(root, ".next", "cache", "small-photos");
const outRoot = path.join(root, "public", "small-photo");
const outDir = path.join(outRoot, "p");

function bucketFileName(src) {
  if (typeof src !== "string" || !/^https:\/\//.test(src)) return null;
  const at = src.indexOf(BUCKET_PATH);
  if (at < 0) return null;
  let name;
  try {
    name = decodeURIComponent(src.slice(at + BUCKET_PATH.length).split(/[?#]/)[0]);
  } catch {
    return null;
  }
  return FILE_NAME.test(name) && !name.includes("..") ? name : null;
}

async function photoNames(base, key) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(base, key);
  const names = new Set();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id,image_url")
      .order("id", { ascending: true })
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const row of data) {
      const name = bucketFileName(row.image_url);
      if (name) names.add(name);
    }
    if (data.length < 1000) return [...names];
  }
}

async function makeSmall(sharp, base, name) {
  const response = await fetch(`${base}${BUCKET_PATH}${encodeURIComponent(name)}`, { signal: AbortSignal.timeout(FETCH_WAIT_MS) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const source = Buffer.from(await response.arrayBuffer());
  if (source.byteLength > MAX_SOURCE_BYTES) throw new Error("too large");
  return sharp(source)
    .rotate()
    .resize({ width: WIDTH, height: WIDTH, fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
}

async function main() {
  nextEnv.loadEnvConfig(root, false, { info() {}, error() {} });
  await rm(outRoot, { recursive: true, force: true });
  if (process.env.SMALL_PHOTOS === "0" || process.env.JALLUNDHAR_LOCAL_PREVIEW === "1") return;
  // Production builds now run on this machine (Cloudflare, `npm run cf:build`), where .next/cache
  // keeps the copies between builds, so only new photos are downloaded. A Vercel preview build starts
  // with an empty cache and would pull the whole bucket (100+ MB) from Supabase, so it skips this;
  // there the route makes the few copies anyone actually looks at. SMALL_PHOTOS=1 forces a run.
  if (process.env.VERCEL && process.env.VERCEL_ENV !== "production" && process.env.SMALL_PHOTOS !== "1") {
    console.log("Small photos: skipped in a Vercel preview build; lists use /api/small-photo instead.");
    return;
  }
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base.startsWith("https://") || !key) return;

  const started = Date.now();
  const names = await photoNames(base, key);
  await mkdir(cacheDir, { recursive: true });
  await mkdir(outDir, { recursive: true });
  const cached = new Set(await readdir(cacheDir));
  const sharp = (await import("sharp")).default;

  let made = 0;
  let failed = 0;
  let skipped = 0;
  const queue = [...names];
  async function worker() {
    for (let name = queue.pop(); name; name = queue.pop()) {
      const file = `${name}.webp`;
      try {
        if (!cached.has(file)) {
          if (Date.now() - started > TIME_LIMIT_MS) {
            skipped += 1;
            continue;
          }
          await writeFile(path.join(cacheDir, file), await makeSmall(sharp, base, name));
          made += 1;
        }
        await copyFile(path.join(cacheDir, file), path.join(outDir, file));
      } catch {
        failed += 1;
      }
    }
  }
  await Promise.all(Array.from({ length: AT_ONCE }, worker));
  const seconds = Math.round((Date.now() - started) / 1000);
  console.log(
    `Small photos: ${names.length - failed - skipped} shipped as files (${made} newly made), ${failed + skipped} left to the route, ${seconds}s`
  );
}

main().catch((error) => {
  console.warn("Small photos not prebuilt; they are made on request instead:", error?.message ?? error);
});
