// service-worker.js

const CACHE_NAME = "fieldguide-cache-v1";

// --- Core app shell (always cached) ---
const APP_SHELL = [
  "/",
  "/index.html",
  "/style.css",
  "/poi/detail.html"
];

// Install SW: pre-cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

// Activate SW: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => key !== CACHE_NAME && caches.delete(key))
      )
    )
  );
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // If request is in cache → serve cached first
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return resp || fetch(event.request);
    })
  );
});

// --- Custom message handler: save a POI offline ---
self.addEventListener("message", async (event) => {
  if (event.data && event.data.type === "CACHE_POI") {
    const { obsId, jsonUrl, photoUrl } = event.data;

    const cache = await caches.open(CACHE_NAME);
    try {
      if (jsonUrl) await cache.add(jsonUrl);
      if (photoUrl) await cache.add(photoUrl);
      console.log(`✅ Cached POI ${obsId}`);
    } catch (err) {
      console.error("Failed to cache POI", err);
    }
  }
});
