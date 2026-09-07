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
markup, then loads `escape.js` and `app.js`:

```html
<script src="vendor/leaflet.js"></script>
<script src="vendor/leaflet.markercluster.js"></script>
<script src="vendor/leaflet-omnivore.min.js"></script>
<script src="escape.js"></script>
<script src="app.js?v=2"></script>
```

`escape.js` must come before any script that calls `escapeHtml`.

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

Three caches are in play, and **the worker owns only two of them**:

- **`fieldguide-cache-v5`** — app shell, cache-first. Owned by the worker;
  versioned, and discarded wholesale on each bump.
- **`fieldguide-tiles-v1`** — OpenStreetMap tiles, network-first, cached on
  success. Owned by the worker.
- **`fieldguide-offline-v1`** — POIs the user chose to keep. Owned by
  `poi/detail.html` (`:97`, `:142`), *not* by the worker. See
  *Save for Offline* below.

One standing rule, learned expensively: **user content never goes in the
versioned cache.** Anything stored under `CACHE_NAME` is app shell, and is
deleted by design on the next bump. User content belongs in
`fieldguide-offline-v1`.

### Delivering a shell change

An earlier revision of this section said any commit touching an `APP_SHELL` file
"must bump `CACHE_NAME`", because a client "keeps serving the copy it already has
until the name changes". Both halves of that mechanism are wrong, and the
measurements below replaced them.

**What makes `install` re-run: any byte change to `service-worker.js`** — not the
cache name. This is the requirement that actually binds. `8e179b4` changed two
precached files and did not touch `service-worker.js` at all, so no update was
detected, `install` never ran, and nothing was delivered.

**Same `CACHE_NAME` — delivery is immediate.** `addAll` replaces entries in
place, in the very cache the running worker reads, so the change is live before
the new worker activates. Measured in `a98d267`, which modified the precached
`poi/detail.html` with no bump: the cached copy lost its marker while the new
worker was still `waiting`, with no new cache created.

**Changed `CACHE_NAME` — delivery waits for `activate`.** The fetch handler calls
`caches.match`, which is `CacheStorage.match` and searches *every* cache in
creation order. After a bump the superseded cache still exists and is searched
first, so it answers with stale content until `activate` deletes it — and
`activate` waits for every tab on the old worker to close. *This branch is
reasoned from the handler and `CacheStorage` semantics; unlike the branch above
it has not been measured here.*

The consequence is worth stating plainly because it inverts the intuition: **a
non-bump shell edit delivers sooner than a bump.**

**So what is a bump for?** Removal and clean rebuilds. `addAll` only adds and
replaces — it never removes — and `activate` evicts whole superseded caches
rather than individual entries. An entry dropped from `APP_SHELL` therefore
persists indefinitely under an unchanged name, and a bump is the way to clear it.

**A third axis, independent of both branches: `install` re-running guarantees
repopulation, not freshness.** `addAll` performs ordinary fetches, which may be
answered from the browser's own HTTP cache, so a re-run can faithfully re-store a
stale response. Versioned query strings such as `app.js?v=2` are what address
this axis. *Unmeasured here — noted so it is not confused with the cache-name
question, which it is independent of.*

That spelling has a measured consequence of its own, in the opposite direction:
`caches.match` keys on the full URL including the query string, so a request for
`app.js?v=2` does **not** match an `APP_SHELL` entry stored as `app.js`. The two
mechanisms are currently in conflict in this app.

`BASE` is derived from the SW's own location so precache paths resolve under
any deploy root:

```js
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

**Cache eviction** — `activate` deletes superseded app shells and nothing else.
Scoping is by prefix rather than by exclusion, so caches the worker does not own
survive a bump:

```js
const SHELL_CACHE_PREFIX = "fieldguide-cache-";

keys
  .filter((key) => key.startsWith(SHELL_CACHE_PREFIX) && key !== CACHE_NAME)
  .map((key) => caches.delete(key))
```

An earlier version deleted every key that was not `CACHE_NAME` or
`TILE_CACHE_NAME`. That made the worker the owner of caches it knows nothing
about, and destroyed `fieldguide-offline-v1` — every POI the user had saved — on
each bump. Fixed in `845b4e8`.

The same commit deleted a `CACHE_POI` message handler that this section used to
document as the mechanism behind "Save for Offline". It never was: nothing in the
app posted that message, and the button has always written to
`fieldguide-offline-v1` directly (see *Save for Offline*).

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

### Helpers

Shared helpers live one-per-file at the repo root — `escape.js` and
`safe-parse.js` — rather than in a single `utils.js`. Each is the only definition
of its function in the codebase.

`escapeHtml`:

```js
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
```

It escapes `"` and `'` as well as `& < >`, because several call sites
interpolate into an attribute value (`alt="${escapeHtml(...)}"`) where a
helper that escapes only angle brackets lets `" onerror="...` inject a
handler. See #15 and #16.

Every page that needs it loads `<script src="escape.js"></script>` after the
`<base href>` IIFE in its `<head>` and before its consumers — including
`poi/detail.html`, where the injected base points at the app root so a bare
`escape.js` resolves correctly from the `poi/` subdirectory. It is listed in
`APP_SHELL` in `service-worker.js`, so precached pages can load it offline.

`safeParse` lives in `safe-parse.js` and follows the same loading rule. It is
loaded by the four pages that consume it — `tripplan.html`, `userjournals.html`,
`poi/detail.html`, and `qr_admin.html` (for `qr_admin.js`) — but not
`index.html`, since `app.js` has no `safeParse` call:

```js
function safeParse(s, fallback = null) {
  try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
```

The `fallback` parameter is load-bearing, not decoration. Before `a98d267` this
existed in two shapes, and `qr_admin.js` calls `safeParse(stored, [])` then reads
`.length` on the result — so a one-argument version would return `null` there and
throw a `TypeError` on malformed `localStorage` instead of degrading to an empty
list. The `s ?` guard preserves the other three pages' behaviour for empty input,
which would otherwise reach `JSON.parse("")` and throw. See #20.

Note that `CODE_REVIEW_REPORT.md` recommends a `utils.js` module consumed by
`import`. It is a point-in-time report rather than a tracker: the app uses classic
scripts with no `type="module"` anywhere, and both consolidations it called for
were done in the one-file-per-helper shape above instead.

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
