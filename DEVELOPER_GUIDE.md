# Developer Guide — Garden Tour

A botanical field guide PWA for Quinta Vale da Lama. Vanilla HTML/CSS/JS,
no build step, GitHub Pages compatible.

---

## Project Structure

```
garden_tour/
├── index.html          # Home: map + observation list + time filters
├── app.js              # All map/observation logic for index.html
├── style.css           # Shared styles
├── manifest.json       # PWA manifest
├── service-worker.js   # Offline caching
├── footer.html         # Shared bottom nav (loaded dynamically by each page)
├── setup.html          # First-run / onboarding
├── tripplan.html       # Personal trip plan (reads tripPlan from localStorage)
├── userjournals.html   # User journals: search + filter over tripPlan entries
├── admin.html          # Admin dashboard
├── qr_admin.html       # QR code generator
├── qr_admin.js         # QR admin logic
├── Q.VdL-Perimeter.kml # Garden perimeter overlay (loaded by app.js)
├── poi/
│   └── detail.html     # POI detail page (reached via QR scan or ?obs=<id>)
├── vendor/
│   ├── leaflet.js
│   ├── leaflet.css
│   ├── leaflet.markercluster.js
│   ├── MarkerCluster.css
│   ├── MarkerCluster.Default.css
│   └── leaflet-omnivore.min.js
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Dependencies

All map libraries are **vendored locally** in `vendor/` and precached by the
service worker — no CDN required, no network needed for map rendering once
installed.

| Library | File | Purpose |
|---|---|---|
| Leaflet | `vendor/leaflet.js` + `vendor/leaflet.css` | Interactive map |
| Leaflet.markercluster | `vendor/leaflet.markercluster.js` + CSS | Observation clustering |
| leaflet-omnivore | `vendor/leaflet-omnivore.min.js` | KML perimeter overlay |
| QRCode.js | CDN (qr_admin.html only) | QR code generation |

`index.html` loads vendor scripts at the bottom of `<body>` after the
markup, then loads `app.js`:

```html
<script src="vendor/leaflet.js"></script>
<script src="vendor/leaflet.markercluster.js"></script>
<script src="vendor/leaflet-omnivore.min.js"></script>
<script src="app.js?v=2"></script>
```

---

## Base-path Detection

Every page's `<head>` begins with the same inline IIFE that sets
`window.appBase` and injects a `<base href>` element. This makes all
relative URLs resolve correctly under any deploy root — localhost, LAN,
`file://`, GitHub Pages (`/garden_tour/`), or a custom domain — without
hostname checks or hardcoded strings.

```js
(function() {
  var dir = location.pathname.replace(/[^/]*$/, '');
  window.appBase = dir.endsWith('/poi/') ? dir.slice(0, -4) : dir;
  var base = document.createElement('base');
  base.href = window.appBase;
  document.head.appendChild(base);
})();
```

`poi/detail.html` is one directory deeper, so the IIFE strips the trailing
`/poi/` to arrive at the same app root as the sibling pages.

**`makeAssetUrl(relativePath)`** in `app.js` builds absolute URLs for
assets that must bypass `<base href>` (currently only the KML file):

```js
function makeAssetUrl(relativePath) {
  return new URL(relativePath, window.location.origin + window.appBase).href;
}
```

---

## CSS Injection

`index.html` injects its stylesheets dynamically in the `<head>` IIFE so
they resolve relative to `window.appBase`:

```js
const cssFiles = [
  "style.css",
  "vendor/leaflet.css",
  "vendor/MarkerCluster.css",
  "vendor/MarkerCluster.Default.css"
];
cssFiles.forEach(href => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href.startsWith("http")
    ? href
    : new URL(href, window.location.origin + window.appBase).href;
  document.head.appendChild(link);
});
```

Other pages load `style.css` via a plain `<link rel="stylesheet" href="style.css">` — the `<base href>` injected by the IIFE resolves it correctly.

---

## Service Worker

`service-worker.js` uses two named caches:

- **`fieldguide-cache-v2`** — app shell (cache-first)
- **`fieldguide-tiles-v1`** — OpenStreetMap tiles (network-first, cached on success)

`BASE` is derived from the SW's own location so precache paths resolve under
any deploy root:

```js
const BASE = self.location.pathname.replace(/service-worker\.js$/, "");
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

**Tile caching** — network-first so fresh tiles are preferred; offline shows
previously visited areas:

```js
if (url.hostname.endsWith("tile.openstreetmap.org")) {
  event.respondWith(
    caches.open(TILE_CACHE_NAME).then(cache =>
      fetch(event.request)
        .then(response => { cache.put(event.request, response.clone()); return response; })
        .catch(() => cache.match(event.request))
    )
  );
  return;
}
```

**On-demand POI caching** via `message` event — `CACHE_POI` is sent from
`poi/detail.html` when the user clicks "Save for Offline":

```js
self.addEventListener("message", async (event) => {
  if (event.data?.type === "CACHE_POI") {
    const { jsonUrl, photoUrl } = event.data;
    const cache = await caches.open(CACHE_NAME);
    if (jsonUrl) await cache.add(jsonUrl);
    if (photoUrl) await cache.add(photoUrl);
  }
});
```

---

## Map & Observations (`app.js`)

### Initialisation

```js
const map = L.map('map').setView([37.1, -8.6], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

omnivore.kml(makeAssetUrl('Q.VdL-Perimeter.kml'))
  .on('ready', function(e) {
    map.fitBounds(e.target.getBounds());
    scheduleRefreshMapView();
  })
  .addTo(map);

const markers = L.markerClusterGroup();
map.addLayer(markers);
```

### Global state

```js
let allObservations = [];     // full iNat result set
let currentObservations = []; // filtered subset
let currentRange = 'today';   // 'today' | 'week' | 'all'
```

### Fetching observations

`fetchObservations()` calls the iNaturalist API directly (no auth, project
#197410). There is no error fallback beyond a console log — offline
resilience comes from the service worker's cache-first strategy.

```js
async function fetchObservations() {
  const url = "https://api.inaturalist.org/v1/observations"
    + "?project_id=197410&order=desc&order_by=observed_on&per_page=200&quality_grade=any";
  const res = await fetch(url);
  const json = await res.json();
  allObservations = json.results || [];
  renderObservations();
}
```

### Filtering and rendering

`renderObservations()` applies a date cutoff based on `currentRange`, then
for each observation with valid coordinates:

1. Adds a `L.marker` with a popup to the `markers` cluster group.
2. Appends a `.observation-item` div to `#observations`.
3. Saves a minimal `{id, species_guess, observed_on, coordinates}` array to
   `localStorage` under `erc_observations` (read by QR Admin).

### Map sizing

`scheduleRefreshMapView()` double-`requestAnimationFrame`s a `map.invalidateSize()` + `fitBounds` call. A `ResizeObserver` on `#map` and a `MutationObserver` on `#observations` both trigger it, keeping the map correctly sized when layout shifts.

---

## Footer

Each page loads `footer.html` after the closing `</body>` tag and wires the
nav links:

```js
fetch(window.appBase + 'footer.html')
  .then(res => res.text())
  .then(html => {
    document.getElementById('site-footer').innerHTML = html;
    document.querySelectorAll('#site-footer .nav-link').forEach(link => {
      link.href = window.appBase + link.dataset.target;
    });
  })
  .catch(err => console.error('Failed to load footer:', err));
```

---

## POI Detail Page (`poi/detail.html`)

Reached via QR scan or direct URL `poi/detail.html?obs=<iNat-id>`.

### Boot sequence

```js
async function boot() {
  const cacheKey = `inat:${current.id}`;
  const cached = safeParse(localStorage.getItem(cacheKey));
  if (cached) setUI(cached, { from: "cache" });  // show instantly if available

  try {
    const live = await fetchObsFromINat(current.id);
    if (live) {
      setUI(live, { from: "network" });
      localStorage.setItem(cacheKey, JSON.stringify(live));
    } else if (!cached) statusEl.textContent = "Observation not found.";
  } catch (e) {
    if (!cached) statusEl.textContent = "Offline or fetch failed — showing placeholders.";
  }
}
```

Cache-then-network: shows stale data instantly, updates when the network responds.

### Helpers (defined inline in `poi/detail.html`)

```js
function safeParse(s) { try { return s ? JSON.parse(s) : null; } catch { return null; } }

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
```

`safeParse` is also duplicated in `qr_admin.js`, `tripplan.html`, and
`userjournals.html`. Consolidation into a shared `utils.js` is a known
todo (see `CODE_REVIEW_REPORT.md`).

### Save for Offline

The "⭐ Save for Offline" button caches the current page URL, the iNat API
JSON URL, and the observation photo URL in `fieldguide-offline-v1`. It also
stores a base64 copy of the image in `localStorage` under `inat:<id>` as a
fallback for environments where the SW cannot intercept.

### Note-taking

Notes are appended to `tripPlan` in `localStorage`:

```js
{
  poi_id: String,        // iNat observation id
  species_name: String,
  image: String,         // src URL of the displayed image
  note: String,
  photo: String | null,  // base64 data URL of user-attached photo
  date_saved: String     // ISO 8601 timestamp
}
```

If "Share this note with the Garden" is checked, the note is POSTed to a
Google Apps Script web app (`shareNoteWithGarden()`). The URL is hardcoded
in `poi/detail.html`; photo binary is not sent (text fields only).

---

## QR Admin (`qr_admin.html` + `qr_admin.js`)

Reads `erc_observations` from `localStorage` (populated by `app.js`) and
generates a QR code for the selected observation's detail URL:

```js
const detailUrl = new URL(
  `poi/detail.html?obs=${encodeURIComponent(obsId)}`,
  window.location.origin + window.appBase
).href;
```

QR codes render to a `<canvas>` via `QRCode` (loaded from
`cdn.jsdelivr.net/npm/qrcode` — the only remaining CDN dependency).

---

## localStorage Schema

| Key | Written by | Read by | Shape |
|---|---|---|---|
| `erc_observations` | `app.js` | `qr_admin.js` | `Array<{id, species_guess, observed_on, coordinates}>` |
| `tripPlan` | `poi/detail.html` | `tripplan.html`, `userjournals.html` | `Array<{poi_id, species_name, image, note, photo, date_saved}>` |
| `inat:<id>` | `poi/detail.html` | `poi/detail.html` | `{id, titleHTML, imageUrl, imageData, inatUrl, inatApiUrl}` |

All data is local to the user's browser. There is no account system or
server-side persistence (except the optional Google Apps Script share path).

---

## Deployment

No build step required — deploy the directory as static files.

**GitHub Pages**: push to `main`; Pages serves from repo root. The
`window.appBase` IIFE automatically derives the correct prefix
(`/garden_tour/`) from `location.pathname`.

**Local development**:

```sh
python3 -m http.server 8080
# then open http://127.0.0.1:8080/
```

Service worker registration uses `window.appBase` so it registers at the
correct scope under any deploy root:

```js
const swUrl = new URL("service-worker.js", window.location.origin + window.appBase).href;
navigator.serviceWorker.register(swUrl);
```
