// @ts-nocheck: resolved by wrangler when it bundles .open-next/worker.js
import openNext from "./.open-next/worker.js";

export { DOQueueHandler } from "./.open-next/worker.js";

/**
 * Edge cache in front of the Next server.
 *
 * A Worker isolate that has not loaded the Next server spends ~2.5 s of CPU loading it on its first
 * request, and with this site's traffic many requests land on such an isolate. Pages that Next would
 * serve from its ISR cache anyway (shop pages, product pages) are therefore kept in Cloudflare's
 * edge cache and answered here, before the Next server is loaded.
 *
 * Freshness: the cache key carries the deployed version and the time of the newest revalidateTag /
 * revalidatePath (D1 tag cache, written by POS refreshes and admin edits). Any of those makes every
 * cached copy unreachable, so a new rate or photo shows on the next request. Copies also expire
 * with the page's own s-maxage.
 */

const SKIP = /^\/(api|account|admin|order|hisab|_next)(\/|$)/;

async function tagVersion(env) {
  try {
    const row = await env.NEXT_TAG_CACHE_D1.prepare("SELECT MAX(revalidatedAt) AS v FROM revalidations").first();
    return String(row?.v ?? 0);
  } catch {
    return null;
  }
}

function cacheable(response) {
  if (response.status !== 200 || response.headers.has("set-cookie")) return 0;
  const cc = response.headers.get("cache-control") || "";
  if (/private|no-store|no-cache/i.test(cc)) return 0;
  const sMaxAge = Number(/s-maxage=(\d+)/i.exec(cc)?.[1] ?? 0);
  return Math.min(sMaxAge, 86400);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const rsc = request.headers.get("rsc") === "1";
    const prefetch = request.headers.get("next-router-prefetch") === "1";
    if (
      request.method !== "GET" ||
      SKIP.test(url.pathname) ||
      request.headers.has("next-action") ||
      // A full (non-prefetch) client navigation may depend on the router state; let Next answer it.
      (rsc && !prefetch)
    ) {
      return openNext.fetch(request, env, ctx);
    }

    const version = await tagVersion(env);
    if (version === null) return openNext.fetch(request, env, ctx);
    const deploy = env.CF_VERSION_METADATA?.id ?? "dev";
    const key = new Request(
      `https://edge-cache.internal/${deploy}/${version}/${rsc ? "rsc" : "html"}${url.pathname}${url.search}`
    );
    const cache = caches.default;

    const hit = await cache.match(key);
    if (hit) {
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

    const response = await openNext.fetch(request, env, ctx);
    const ttl = cacheable(response);
    if (!ttl) return response;
    const copy = new Response(response.clone().body, response);
    for (const name of ["cache-control", "vary"]) {
      const value = response.headers.get(name);
      if (value) copy.headers.set(`x-original-${name}`, value);
    }
    copy.headers.delete("vary");
    copy.headers.set("cache-control", `public, max-age=${ttl}`);
    ctx.waitUntil(cache.put(key, copy));
    const out = new Response(response.body, response);
    out.headers.set("x-edge-cache", "MISS");
    return out;
  },
};
