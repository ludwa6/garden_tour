// service-worker.js

const CACHE_NAME = "fieldguide-cache-v5";
const TILE_CACHE_NAME = "fieldguide-tiles-v1";

// Versioned app-shell caches all share this prefix. Eviction on activate keys
// on it, so bumping CACHE_NAME drops superseded shells and nothing else.
const SHELL_CACHE_PREFIX = "fieldguide-cache-";

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

// Activate SW: drop superseded app-shell caches, and only those.
//
// Eviction is by prefix, not by exclusion. The previous form deleted every key
// that was not CACHE_NAME or TILE_CACHE_NAME, which made this worker the owner
// of caches it knows nothing about -- notably "fieldguide-offline-v1", which
// poi/detail.html fills from the Save Offline button (:97, :142). That is
// user-chosen content and must survive a CACHE_NAME bump.
//
// The corollary, which cost a deleted CACHE_POI handler to learn: never write
// user content under CACHE_NAME. Everything in the versioned cache is app
// shell, and is discarded by design on the next bump.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(SHELL_CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
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
