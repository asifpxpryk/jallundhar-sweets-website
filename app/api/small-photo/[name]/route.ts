import { PHOTO_BUCKET_PATH, SMALL_PHOTO_QUALITY, SMALL_PHOTO_WIDTH, isBucketFileName } from "@/lib/smallPhoto";

export const runtime = "nodejs";

const FETCH_WAIT_MS = 10_000;
/** The bucket's photos are well under this; anything larger is not a product photo. */
const MAX_SOURCE_BYTES = 6 * 1024 * 1024;
/** The copy never changes for a file name (a new photo gets a new name), so the CDN and the browser keep it. */
const KEEP = "public, max-age=2592000, s-maxage=31536000, stale-while-revalidate=31536000";

function gone(status: number) {
  return new Response(null, { status, headers: { "Cache-Control": "public, max-age=60" } });
}

/**
 * A product photo from the shop's own bucket, made small for lists. Only that bucket is ever read.
 * The build ships these copies as files; this runs only for a photo added since (see lib/smallPhoto.ts).
 */
export async function GET(_request: Request, { params }: { params: { name: string } }) {
  const name = params.name;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  if (!base.startsWith("https://") || !isBucketFileName(name)) return gone(404);

  // Cloudflare Workers have no sharp: send the browser to the full photo instead (briefly cached, so
  // the next build's small copy takes over).
  const sharp = await import("sharp").then((m) => m.default).catch(() => null);
  if (!sharp) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${base}${PHOTO_BUCKET_PATH}${encodeURIComponent(name)}`, "Cache-Control": "public, max-age=3600" },
    });
  }

  let source: ArrayBuffer;
  try {
    const response = await fetch(`${base}${PHOTO_BUCKET_PATH}${encodeURIComponent(name)}`, {
      signal: AbortSignal.timeout(FETCH_WAIT_MS),
      cache: "no-store",
    });
    if (!response.ok) return gone(response.status === 404 || response.status === 400 ? 404 : 502);
    if (Number(response.headers.get("content-length") ?? 0) > MAX_SOURCE_BYTES) return gone(404);
    source = await response.arrayBuffer();
    if (source.byteLength > MAX_SOURCE_BYTES) return gone(404);
  } catch {
    return gone(502);
  }

  try {
    const small = await sharp(Buffer.from(source))
      .rotate()
      .resize({ width: SMALL_PHOTO_WIDTH, height: SMALL_PHOTO_WIDTH, fit: "inside", withoutEnlargement: true })
      .webp({ quality: SMALL_PHOTO_QUALITY })
      .toBuffer();
    return new Response(new Uint8Array(small), {
      headers: { "Content-Type": "image/webp", "Cache-Control": KEEP, "Content-Length": String(small.length) },
    });
  } catch {
    return gone(404);
  }
}
