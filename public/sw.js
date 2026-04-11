// Innara Service Worker — PWA offline support
// Cache strategy: cache-first for static assets, network-first for API calls

const CACHE_NAME = "innara-v1";
const OFFLINE_URL = "/offline";

const STATIC_ASSETS = [
  "/offline",
  "/manifest.json",
];

// Install: pre-cache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigation/API, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip external requests
  if (url.origin !== self.location.origin) return;

  // Skip API routes and auth — always go to network
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  // Navigation requests: network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Try cache first, then offline page
          return caches.match(request).then(
            (cached) => cached || caches.match(OFFLINE_URL)
          );
        })
    );
    return;
  }

  // Static assets: cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Everything else: network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Background sync for offline service requests
self.addEventListener("sync", (event) => {
  if (event.tag === "innara-offline-requests") {
    event.waitUntil(syncOfflineRequests());
  }
});

async function syncOfflineRequests() {
  // Retrieve queued requests from IndexedDB and replay them
  // This is handled by the client-side hook; the SW just triggers the sync
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: "SYNC_OFFLINE_REQUESTS" });
  }
}
