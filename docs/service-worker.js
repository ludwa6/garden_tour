const STATIC_CACHE = 'gt-static-v1';
const RUNTIME_CACHE = 'gt-runtime';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './qr_admin.html',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js',
  'https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.css',
  'https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.Default.css',
  'https://unpkg.com/leaflet.markercluster/dist/leaflet.markercluster.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => {
      if (![STATIC_CACHE, RUNTIME_CACHE].includes(k)) return caches.delete(k);
    })))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Cache-first for same-origin & CDN libs
  if (url.origin === location.origin || ['unpkg.com','cdnjs.cloudflare.com'].includes(url.hostname)) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(STATIC_CACHE).then(c => c.put(req, copy));
        return resp;
      }))
    );
    return;
  }

  // Runtime caching for images and tiles
  if (req.destination === 'image' || url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache =>
        fetch(req).then(resp => {
          cache.put(req, resp.clone());
          return resp;
        }).catch(() => cache.match(req))
      )
    );
    return;
  }

  // Default: network-first, fallback to cache
  event.respondWith(
    fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
      return resp;
    }).catch(() => caches.match(req))
  );
});
