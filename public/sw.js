const CACHE_VERSION = "gymbro-v3";
const CACHE_NAME = `gymbro-cache-${CACHE_VERSION}`;

const APP_SHELL_FILES = ["/", "/manifest.webmanifest"];

const API_HOSTS = ["gymbro-api.imtiyazsayyid.in", "localhost", "127.0.0.1"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_FILES)));

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("gymbro-cache-") && key !== CACHE_NAME).map((key) => caches.delete(key)))));

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache backend API requests.
  // These must always hit the network because they contain live user data.
  if (API_HOSTS.includes(url.hostname) && url.pathname.startsWith("/api/")) {
    return;
  }

  // Never cache any cross-origin requests.
  // This prevents accidental caching of APIs, CDNs, auth calls, etc.
  if (url.origin !== self.location.origin) {
    return;
  }

  const isNavigationRequest = event.request.mode === "navigate";

  // For page navigations:
  // Try network first. If offline, fall back to cached app shell.
  if (isNavigationRequest) {
    event.respondWith(fetch(event.request).catch(() => caches.match("/") || Response.error()));
    return;
  }

  const isStaticAsset = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest" || url.pathname === "/favicon.ico";

  // Only cache safe static assets.
  if (!isStaticAsset) {
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
