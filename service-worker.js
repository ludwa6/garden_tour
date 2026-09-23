// service-worker.js

const CACHE_NAME = "fieldguide-cache-v6";
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
  BASE + "footer.html",
  BASE + "style.css",
  BASE + "escape.js",
  BASE + "safe-parse.js",
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

// Paths whose cached entry may answer a request carrying a query string.
//
// CacheStorage.match keys on the FULL url, query included, so a precached
// "poi/detail.html" never matched a request for "poi/detail.html?obs=123" --
// which is every POI navigation in the app, including the url burned into each
// QR code. Same for index.html asking for "app.js?v=2". See #21.
//
// Scoped to APP_SHELL on purpose, rather than passing ignoreSearch for every
// request. For these paths the query provably does not select content: each is
// a static file the server returns identically whatever follows the "?", and
// poi/detail.html is one document that reads its own ?obs at runtime. That
// guarantee does not extend past this list -- app.js asks
// api.inaturalist.org/v1/observations with the project, ordering and page size
// all in the query string, and poi/detail.html writes cross-origin responses
// into fieldguide-offline-v1, which caches.match also searches. Ignoring the
// query there would let one request answer with another's response.
const SHELL_PATHS = new Set(APP_SHELL);

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

  // Everything else: cache-first, fall back to network. App-shell paths match
  // regardless of query string (see SHELL_PATHS); everything else matches
  // exactly, because outside that list the query can select the content.
  const isShellPath =
    url.origin === self.location.origin && SHELL_PATHS.has(url.pathname);

  event.respondWith(
    caches
      .match(event.request, isShellPath ? { ignoreSearch: true } : undefined)
      .then((resp) => {
        return resp || fetch(event.request);
      })
  );
});
