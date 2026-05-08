const CACHE_VERSION = "gymbro-v2";
const CACHE_NAME = `gymbro-cache-${CACHE_VERSION}`;
const APP_SHELL_FILES = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache backend API requests
  if (url.hostname === "gymbro-api.imtiyazsayyid.in" && url.pathname.startsWith("/api/")) {
    return;
  }

  // Never cache local/dev API requests
  if ((url.hostname === "localhost" || url.hostname === "127.0.0.1") && url.pathname.startsWith("/api/")) {
    return;
  }

  const isNavigationRequest = event.request.mode === "navigate";

  if (isNavigationRequest) {
    event.respondWith(fetch(event.request).catch(() => caches.match("/") || Response.error()));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        const copy = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, copy);
        });

        return networkResponse;
      });
    }),
  );
});
