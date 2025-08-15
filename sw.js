const CACHE_NAME = "vdl-cache-v3";
const urlsToCache = [
  "./",
  "./index.html",
  "./app.js",
  "./style.css",
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
];

// iNaturalist API URL for Vale da Lama
const iNatProjectURL = "https://api.inaturalist.org/v1/observations?project_slug=erc-vale-da-lama&per_page=200";

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Pre-caching assets and iNat data");
      return Promise.all([
        cache.addAll(urlsToCache),
        fetch(iNatProjectURL)
          .then(res => {
            cache.put(iNatProjectURL, res.clone());
            // Send to client right away if possible
            return res.json();
          })
          .then(data => {
            self.skipWaiting();
            self.clients.matchAll({ type: "window" }).then(clients => {
              clients.forEach(client => client.postMessage({
                type: "INIT_OBSERVATIONS",
                payload: data
              }));
            });
          })
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, fetchRes.clone());
          return fetchRes;
        });
      });
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
});
