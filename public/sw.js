// Jallundhar service worker: network first, cache only as an offline fallback.
// Bump CACHE_NAME whenever this file changes so old caches are cleared on activate.
const CACHE_NAME = "jallundhar-v7";
const APP_SHELL = ["/", "/manifest.json", "/logo.png", "/pwa/icon-192.png", "/pwa/icon-512.png"];

// Paths that must always come straight from the network (live data, admin, orders).
const NETWORK_ONLY = /^\/(api|account|admin|hisab)(\/|$)|^\/_vercel\//;
// Files worth keeping for offline use: Next.js build files and images/icons/fonts.
const CACHEABLE = /^\/_next\/static\/|\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i;

const OFFLINE_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline | Jallundhar Sweets &amp; Bakers</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fdf6ec;color:#4a151a;font-family:system-ui,sans-serif;text-align:center;padding:24px}a{color:#7a1f25;font-weight:600}</style></head><body><main><h1>You are offline</h1><p>Please check your internet connection and try again.</p><p><a href="">Try again</a> · WhatsApp: <a href="https://wa.me/923001538440">0300 153 8440</a></p></main></body></html>`;

function offlineResponse() {
  return new Response(OFFLINE_PAGE, {
    status: 503,
    statusText: "Offline",
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // One missing file must not stop the worker from installing.
      .then((cache) => Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => undefined))))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Other websites (Facebook, Supabase photos, maps): let the browser handle them normally.
  if (url.origin !== self.location.origin) return;
  if (NETWORK_ONLY.test(url.pathname)) return;
  // Next.js page data for in-app navigation: no offline copy, so leave it to the browser.
  if (url.searchParams.has("_rsc") || request.headers.get("RSC") === "1") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match("/")) || offlineResponse())
    );
    return;
  }

  if (!CACHEABLE.test(url.pathname)) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Keep only complete, successful same-site responses.
        if (response.ok && response.type === "basic" && response.status === 200) {
          const copy = response.clone();
          event.waitUntil(
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => undefined)
          );
        }
        return response;
      })
      .catch(async () => (await caches.match(request)) || Response.error())
  );
});
