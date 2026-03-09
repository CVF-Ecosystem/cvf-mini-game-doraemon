const CACHE_NAME = "cvf-mini-game-v2";
const APP_SHELL = ["/", "/offline", "/manifest.webmanifest", "/favicon.ico"];
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  const isLocalhost = LOCAL_HOSTS.has(self.location.hostname);
  if (isLocalhost && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          const offlinePage = await caches.match("/offline");
          if (offlinePage) return offlinePage;
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })(),
    );
    return;
  }

  const isScriptAsset = request.destination === "script" || url.pathname.startsWith("/_next/static/");
  if (isScriptAsset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            void cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          return new Response("Offline", { status: 503, statusText: "Offline" });
        }
      })(),
    );
    return;
  }

  const shouldCacheStatic =
    request.destination === "style" ||
    request.destination === "image" ||
    request.destination === "font";

  if (!shouldCacheStatic) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const cloned = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(async () => {
          const offlinePage = await caches.match("/offline");
          return offlinePage || new Response("Offline", { status: 503, statusText: "Offline" });
        });
    }),
  );
});
