// @ts-nocheck: resolved by wrangler when it bundles .open-next/worker.js
import openNext from "./.open-next/worker.js";

export { DOQueueHandler } from "./.open-next/worker.js";

/**
 * Fast path in front of the Next server.
 *
 * A Worker isolate that has not loaded the Next server spends ~2.5 s of CPU loading it, and with this
 * site's traffic many requests land on such an isolate. Pages Next would answer from its ISR cache
 * anyway (shop, category and product pages) are answered here without loading it:
 *
 * 1. Cloudflare's edge cache (per data centre). Key: deployed version + newest revalidation in D1.
 * 2. The OpenNext page cache in R2 (global), read the same way OpenNext's cache interception reads it:
 *    the entry is skipped if one of its tags was revalidated after it was written (POS refresh, admin
 *    edit) or if it is older than its revalidate time, and Next then renders it as before.
 *
 * Anything else (API routes, account/admin, server actions, cookies-dependent pages, redirects, misses)
 * goes to the Next server unchanged.
 */

/**
 * Product photos come from R2 instead of Supabase Storage (whose egress the free plan caps).
 * Pages, RSC payloads and JSON carry the Supabase public URL; it is swapped for a same-length URL on
 * this site, so the RSC payload's length-prefixed rows stay valid and lib/smallPhoto.ts still finds
 * the bucket path in it. A photo missing from R2 is fetched from Supabase once and kept.
 */
const SUPABASE_PHOTOS = "https://gyahtewnpgzswfumljoa.supabase.co/storage/v1/object/public/product-photos/";
const PHOTO_ROUTE_START = "/img/";
const PHOTO_PREFIX = (() => {
  const head = `https://www.jallundharmain.com${PHOTO_ROUTE_START}`;
  const tail = "/storage/v1/object/public/product-photos/";
  return head + "r".repeat(SUPABASE_PHOTOS.length - head.length - tail.length) + tail;
})();
const PHOTO_PATH = PHOTO_PREFIX.slice("https://www.jallundharmain.com".length);
const PHOTO_KEEP = "public, max-age=31536000, immutable";
const REWRITE_TYPES = /^(text\/html|text\/x-component|application\/json)/i;

async function servePhoto(request, env, ctx, url) {
  let name;
  try {
    name = decodeURIComponent(url.pathname.slice(PHOTO_PATH.length));
  } catch {
    return new Response("Not found", { status: 404 });
  }
  if (!name || name.includes("/") || name.includes("..") || name.length > 200) {
    return new Response("Not found", { status: 404 });
  }
  const cache = caches.default;
  const cacheKey = new Request(`https://photo-cache.internal/${encodeURIComponent(name)}`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const headers = { "Cache-Control": PHOTO_KEEP, "Cross-Origin-Resource-Policy": "same-site" };
  const object = await env.PRODUCT_PHOTOS.get(name);
  let response;
  if (object) {
    response = new Response(object.body, {
      headers: { ...headers, "Content-Type": object.httpMetadata?.contentType || "image/webp", ETag: object.httpEtag },
    });
  } else {
    const upstream = await fetch(SUPABASE_PHOTOS + encodeURIComponent(name));
    if (!upstream.ok) {
      return new Response("Not found", { status: upstream.status === 404 || upstream.status === 400 ? 404 : 502, headers: { "Cache-Control": "public, max-age=60" } });
    }
    const bytes = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "image/webp";
    ctx.waitUntil(env.PRODUCT_PHOTOS.put(name, bytes, { httpMetadata: { contentType } }));
    response = new Response(bytes, { headers: { ...headers, "Content-Type": contentType } });
  }
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

/** Swap Supabase photo URLs for the R2 route in a page, RSC payload or JSON body. */
async function withR2Photos(response) {
  const type = response.headers.get("content-type") || "";
  if (!REWRITE_TYPES.test(type) || !response.body) return response;
  const text = await response.text();
  if (!text.includes(SUPABASE_PHOTOS)) {
    return new Response(text, response);
  }
  const out = new Response(text.replaceAll(SUPABASE_PHOTOS, PHOTO_PREFIX), response);
  out.headers.delete("content-length");
  return out;
}

const SKIP = /^\/(api|account|admin|order|hisab|_next)(\/|$)/;
/**
 * The product lists the search box and lists load. Every POS refresh drops them (tag "menu"), and
 * rebuilding one reads the whole menu from Supabase (4-7 s, ~1.5 MB). The last copy is served at once
 * while a fresh one is built in the background, so search always answers right away.
 */
const STALE_OK = /^\/api\/(catalog|menu)$/;
const STALE_EDGE_TTL_S = 60;
// Old product ids are redirected by middleware.ts; keep them away from the fast path.
const LEGACY_PRODUCT = /^\/product\/(pos-.+|item-.+|\d+|cream-cake-oreo-2-pound)$/;
const VARY = "RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url";
/** Every ISR page here revalidates after a week or more; an older copy goes back to Next. */
const MAX_AGE_S = 604800;
const ONE_MONTH_S = 2592000;

let buildIdPromise = null;
function buildId(env) {
  buildIdPromise ??= env.ASSETS.fetch("https://assets.local/BUILD_ID")
    .then((r) => (r.ok ? r.text() : null))
    .then((t) => t?.trim() || null)
    .catch(() => null);
  return buildIdPromise;
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function newestRevalidation(env) {
  try {
    const row = await env.NEXT_TAG_CACHE_D1.prepare("SELECT MAX(revalidatedAt) AS v FROM revalidations").first();
    return String(row?.v ?? 0);
  } catch {
    return null;
  }
}

function cacheKeyPath(pathname) {
  if (pathname === "/") return "/index";
  return pathname
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment).replace(/[/#?]/g, (c) => encodeURIComponent(c));
      } catch {
        return segment;
      }
    })
    .join("/");
}

/**
 * The page (or cached route like /api/menu) from the OpenNext R2 cache, or null when Next has to
 * answer. With allowStale, an outdated copy is returned too, marked stale.
 */
async function fromR2(env, url, rsc, allowStale = false, allowRoute = false) {
  const id = await buildId(env);
  if (!id) return null;
  const path = cacheKeyPath(url.pathname);
  const object = await env.NEXT_INC_CACHE_R2_BUCKET.get(`incremental-cache/${id}/${await sha256Hex(path)}.cache`);
  if (!object) return null;
  const value = await object.json().catch(() => null);
  if (!value || (value.type !== "app" && !(allowRoute && value.type === "route"))) return null;
  let stale = false;

  const lastModified = object.uploaded.getTime();
  const revalidate = typeof value.revalidate === "number" ? value.revalidate : MAX_AGE_S;
  if (value.revalidate === 0) return null;
  const age = Math.round((Date.now() - lastModified) / 1000);
  if (value.revalidate !== false && age >= Math.min(revalidate, MAX_AGE_S)) {
    if (!allowStale) return null;
    stale = true;
  }

  const headers = { ...(value.meta?.headers ?? {}) };
  const tags = String(headers["x-next-cache-tags"] ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  delete headers["x-next-cache-tags"];
  if (tags.length) {
    const keys = tags.map((t) => `${id}/${t}`.replaceAll("//", "/"));
    const hit = await env.NEXT_TAG_CACHE_D1.prepare(
      `SELECT 1 FROM revalidations WHERE tag IN (${keys.map(() => "?").join(", ")}) AND revalidatedAt > ? LIMIT 1`
    )
      .bind(...keys, lastModified)
      .raw();
    if (hit.length) {
      if (!allowStale) return null;
      stale = true;
    }
  }

  const isRoute = value.type === "route";
  if (isRoute && value.isBase64Encoded) return null;
  const body = isRoute ? value.body : rsc ? value.rsc : value.html;
  if (typeof body !== "string") return null;
  const sMaxAge = value.revalidate === false ? 31536000 : Math.max(Math.min(revalidate, MAX_AGE_S) - age, 1);
  const response = new Response(body, {
    status: value.meta?.status ?? 200,
    headers: {
      "cache-control": `s-maxage=${sMaxAge}, stale-while-revalidate=${ONE_MONTH_S}`,
      "content-type": isRoute ? "application/json" : rsc ? "text/x-component" : "text/html; charset=utf-8",
      ...headers,
      vary: VARY,
      "x-opennext-cache": stale ? "STALE" : "HIT",
    },
  });
  return { response, stale };
}

function edgeTtl(response) {
  if (response.status !== 200 || response.headers.has("set-cookie")) return 0;
  const cc = response.headers.get("cache-control") || "";
  if (/private|no-store|no-cache/i.test(cc)) return 0;
  const sMaxAge = Number(/s-maxage=(\d+)/i.exec(cc)?.[1] ?? 0);
  return Math.min(sMaxAge, 86400);
}

function fromEdgeCopy(hit) {
  const response = new Response(hit.body, hit);
  // Give the browser the headers Next sent, not the edge copy's TTL.
  for (const name of ["cache-control", "vary"]) {
    const original = hit.headers.get(`x-original-${name}`);
    response.headers.delete(name);
    if (original) response.headers.set(name, original);
    response.headers.delete(`x-original-${name}`);
  }
  response.headers.set("x-edge-cache", "HIT");
  return response;
}

function edgeCopy(response, ttl) {
  const copy = new Response(response.clone().body, response);
  for (const name of ["cache-control", "vary"]) {
    const value = response.headers.get(name);
    if (value) copy.headers.set(`x-original-${name}`, value);
  }
  copy.headers.delete("vary");
  copy.headers.set("cache-control", `public, max-age=${ttl}`);
  return copy;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith(PHOTO_PATH) && (request.method === "GET" || request.method === "HEAD")) {
      return servePhoto(request, env, ctx, url);
    }
    return withR2Photos(await handlePage(request, env, ctx, url));
  },
};

async function handlePage(request, env, ctx, url) {
  {
    const rsc = request.headers.get("rsc") === "1";
    if (
      request.method !== "GET" ||
      (SKIP.test(url.pathname) && !STALE_OK.test(url.pathname)) ||
      LEGACY_PRODUCT.test(url.pathname) ||
      (url.pathname !== "/" && url.pathname.endsWith("/")) ||
      request.headers.has("next-action") ||
      request.headers.has("next-router-segment-prefetch") ||
      /__prerender_bypass|__next_preview_data/.test(request.headers.get("cookie") || "")
    ) {
      return openNext.fetch(request, env, ctx);
    }

    const version = await newestRevalidation(env);
    if (version === null) return openNext.fetch(request, env, ctx);
    const deploy = env.CF_VERSION_METADATA?.id ?? "dev";
    const key = new Request(
      `https://edge-cache.internal/${deploy}/${version}/${rsc ? "rsc" : "html"}${url.pathname}${url.search}`
    );
    const cache = caches.default;

    const hit = await cache.match(key);
    if (hit) return fromEdgeCopy(hit);

    let response = null;
    let source = "next";
    let stale = false;
    try {
      // Pages too: a POS refresh drops every product page at once, and rebuilding one takes 6-8 s, so
      // the last copy is shown while the fresh one is built.
      const found = await fromR2(env, url, rsc, true, STALE_OK.test(url.pathname));
      if (found) {
        response = found.response;
        stale = found.stale;
        source = stale ? "r2-stale" : "r2";
      }
    } catch {
      response = null;
    }
    if (stale) {
      // Build the fresh copy in the background (Next writes it to R2); this copy is kept briefly so
      // other visitors here don't each start a rebuild.
      ctx.waitUntil(
        openNext
          .fetch(new Request(url.toString(), { method: "GET" }), env, ctx)
          .then((r) => r.arrayBuffer())
          .catch(() => undefined)
      );
      ctx.waitUntil(cache.put(key, edgeCopy(response, STALE_EDGE_TTL_S)));
      const out = new Response(response.body, response);
      out.headers.set("x-edge-cache", `MISS-${source}`);
      return out;
    }
    response ??= await openNext.fetch(request, env, ctx);

    const ttl = edgeTtl(response);
    if (ttl) ctx.waitUntil(cache.put(key, edgeCopy(response, ttl)));
    const out = new Response(response.body, response);
    out.headers.set("x-edge-cache", `MISS-${source}`);
    return out;
  }
}
