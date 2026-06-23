# Before

`service-worker.js` precaches only 4 paths:

```js
[ BASE, BASE + "index.html", BASE + "style.css", BASE + "poi/detail.html" ]
```

Missing same-origin assets: `app.js`, `Q.VdL-Perimeter.kml`, `manifest.json`, `icons/icon-192.png`, `icons/icon-512.png`.

`index.html` loads Leaflet JS + CSS, markercluster, and omnivore from `unpkg.com` (cross-origin), so those libraries are never cached and the map fails to render offline.

The fetch handler does cache-first but there is no tile caching strategy — tiles from `tile.openstreetmap.org` are never stored.

Result: with the network off, the HTML shell loads but the map does not render.

# After

Three-part fix:

**1. Vendor Leaflet libraries locally.**

Download into `vendor/`:
- `leaflet/dist/leaflet.js` + `leaflet.css`
- `leaflet.markercluster/dist/leaflet.markercluster.js` + `MarkerCluster.css` + `MarkerCluster.Default.css`
- `leaflet-omnivore@0.3.4/leaflet-omnivore.min.js`

Update `index.html` to load from `vendor/` instead of `unpkg.com`. These 6 files become same-origin and join the precache.

**2. Expand the precache list in `service-worker.js`.**

```js
const APP_SHELL = [
  BASE,
  BASE + "index.html",
  BASE + "style.css",
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
```

Bump `CACHE_NAME` to `fieldguide-cache-v2` so existing installs pick up the new shell.

**3. Add a runtime tile-caching strategy.**

In the fetch handler, detect requests to `tile.openstreetmap.org` and apply network-first with cache fallback (tiles fetched while online are stored; offline shows previously viewed tiles). The garden area is small, so a few online sessions will cache the relevant tiles.

Alternatives considered:
- **Bundle a tile set** — rejected: too large and brittle to maintain.
- **Accept no basemap offline** — rejected: markers float on a gray background with no geographic context; perimeter overlay needs tile reference to be legible.
- **Runtime-cache Leaflet from unpkg instead of vendoring** — rejected: opaque responses have unpredictable quota padding and no error visibility; vendoring is a one-time 400 KB addition with no ongoing cost.

Update README/ROADMAP to clarify that offline mode requires at least one prior online visit to cache the map tiles for the garden area.
