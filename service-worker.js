// service-worker.js

const CACHE_NAME = "fieldguide-cache-v4";
const TILE_CACHE_NAME = "fieldguide-tiles-v1";

// --- Core app shell (always cached) ---
// Derive the base from the SW's own location so precache paths resolve
// correctly under any deploy root (/ locally, /garden_tour/ on Pages).
const BASE = self.location.pathname.replace(/service-worker\.js$/, "");
const APP_SHELL = [
  BASE,
  BASE + "index.html",
  BASE + "style.css",
  BASE + "escape.js",
  BASE + "app.js",
  BASE + "manifest.json",
  BASE + "icons/icon-192.png",
  BASE + "icons/icon-512.png",
  BASE + "Q.VdL-Perimeter.kml",
  BASE + "poi/detail.html",
  BASE + "vendor/leaflet.js",
  BASE + "vendor/leaflet.css",
  BASE + "vendor/leaflet.markercluster.js",
  BASE + "vendor/MarkerCluster.css",
  BASE + "vendor/MarkerCluster.Default.css",
  BASE + "vendor/leaflet-omnivore.min.js",
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
        keys.map((key) => key !== CACHE_NAME && key !== TILE_CACHE_NAME && caches.delete(key))
      )
    )
  );
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Map tiles: network-first, cache on success so offline shows visited tiles
  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then((cache) =>
        fetch(event.request)
          .then((response) => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cache.match(event.request))
      )
    );
    return;
  }

  // Everything else: cache-first, fall back to network
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
