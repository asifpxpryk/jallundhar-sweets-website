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

const SKIP = /^\/(api|account|admin|order|hisab|_next)(\/|$)/;
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

/** The page from the OpenNext R2 cache, or null when Next has to answer. */
async function fromR2(env, url, rsc) {
  const id = await buildId(env);
  if (!id) return null;
  const path = cacheKeyPath(url.pathname);
  const object = await env.NEXT_INC_CACHE_R2_BUCKET.get(`incremental-cache/${id}/${await sha256Hex(path)}.cache`);
  if (!object) return null;
  const value = await object.json().catch(() => null);
  if (!value || value.type !== "app") return null;

  const lastModified = object.uploaded.getTime();
  const revalidate = typeof value.revalidate === "number" ? value.revalidate : MAX_AGE_S;
  if (value.revalidate === 0) return null;
  const age = Math.round((Date.now() - lastModified) / 1000);
  if (value.revalidate !== false && age >= Math.min(revalidate, MAX_AGE_S)) return null;

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
    if (hit.length) return null;
  }

  const body = rsc ? value.rsc : value.html;
  if (typeof body !== "string") return null;
  const sMaxAge = value.revalidate === false ? 31536000 : Math.max(Math.min(revalidate, MAX_AGE_S) - age, 1);
  const response = new Response(body, {
    status: value.meta?.status ?? 200,
    headers: {
      "cache-control": `s-maxage=${sMaxAge}, stale-while-revalidate=${ONE_MONTH_S}`,
      "content-type": rsc ? "text/x-component" : "text/html; charset=utf-8",
      ...headers,
      vary: VARY,
      "x-opennext-cache": "HIT",
    },
  });
  return response;
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
    const rsc = request.headers.get("rsc") === "1";
    if (
      request.method !== "GET" ||
      SKIP.test(url.pathname) ||
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
    try {
      response = await fromR2(env, url, rsc);
      if (response) source = "r2";
    } catch {
      response = null;
    }
    response ??= await openNext.fetch(request, env, ctx);

    const ttl = edgeTtl(response);
    if (ttl) ctx.waitUntil(cache.put(key, edgeCopy(response, ttl)));
    const out = new Response(response.body, response);
    out.headers.set("x-edge-cache", `MISS-${source}`);
    return out;
  },
};
