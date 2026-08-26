const APP_VERSION = "9.3.0";
const STATIC_CACHE = `investor-coach-static-${APP_VERSION}`;
const RUNTIME_CACHE = `investor-coach-runtime-${APP_VERSION}`;
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./config.js",
  "./data.js",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/apple-touch-icon-180.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => ![STATIC_CACHE, RUNTIME_CACHE].includes(key)).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request, "./index.html"));
    return;
  }

  event.respondWith(networkFirst(event.request));
});

async function networkFirst(request, offlineFallback) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    const runtime = await caches.open(RUNTIME_CACHE);
    const runtimeCached = await runtime.match(request, { ignoreSearch: true });
    if (runtimeCached) return runtimeCached;
    const staticCache = await caches.open(STATIC_CACHE);
    const staticCached = await staticCache.match(request, { ignoreSearch: true });
    if (staticCached) return staticCached;
    if (offlineFallback) {
      const runtimeFallback = await runtime.match(offlineFallback);
      if (runtimeFallback) return runtimeFallback;
      const fallback = await staticCache.match(offlineFallback);
      if (fallback) return fallback;
    }
    return new Response("Нет подключения к интернету и ресурс ещё не был сохранён офлайн.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
