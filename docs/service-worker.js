// service-worker.js

// 🔄 bump this version string whenever you change app.js, HTML, or assets
const SW_VERSION = "v3";
const CACHE_NAME = `garden-tour-${SW_VERSION}`;

// which files to cache immediately
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./app.js",
  "./style.css",
  "https://unpkg.com/leaflet/dist/leaflet.css",
  "https://unpkg.com/leaflet/dist/leaflet.js",
  "https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.css",
  "https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.Default.css",
  "https://unpkg.com/leaflet.markercluster/dist/leaflet.markercluster.js"
];

// install — pre-cache app shell
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting(); // activate worker immediately
});

// activate — cleanup old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim(); // control any open pages immediately
});

// fetch — network-first for API calls, cache-first for assets
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Let API requests (iNat etc.) go straight to network
  if (url.hostname.includes("inaturalist.org")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For app shell files → cache-first
  event.respondWith(
    caches.match(event.request).then(response =>
      response ||
      fetch(event.request).then(fetchRes =>
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, fetchRes.clone());
          return fetchRes;
        })
      )
    )
  );
});
