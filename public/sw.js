const CACHE_VERSION = "gymbro-v4";
const CACHE_NAME = `gymbro-cache-${CACHE_VERSION}`;

const STATIC_ASSET_PATHS = ["/manifest.webmanifest", "/favicon.ico"];

const API_HOSTS = new Set(["gymbro-api.imtiyazsayyid.in", "localhost", "127.0.0.1"]);

function isApiRequest(url) {
  return API_HOSTS.has(url.hostname) && url.pathname.startsWith("/api/");
}

function isStaticAsset(url) {
  return url.origin === self.location.origin && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest" || url.pathname === "/favicon.ico");
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSET_PATHS)));

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("gymbro-cache-") && key !== CACHE_NAME).map((key) => caches.delete(key)))), self.clients.claim()]));
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (isApiRequest(url)) {
    event.respondWith(
      fetch(
        new Request(event.request, {
          cache: "no-store",
        }),
      ),
    );

    return;
  }

  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
    return;
  }

  if (!isStaticAsset(url)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const copy = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, copy);
        });

        return networkResponse;
      });
    }),
  );
});
