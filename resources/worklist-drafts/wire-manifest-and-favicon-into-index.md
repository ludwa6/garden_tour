# Before

`manifest.json` is correct (icons fixed in #3), but **nothing in `index.html` references it**. The `<head>` (lines 3–39) has `<meta>`, `<title>`, and a dynamic-injection `<script>` for CSS + service worker, but:

- No `<link rel="manifest" href="manifest.json">` — so the browser never loads the manifest. The install prompt, **DevTools → Application → Manifest**, and the Android splash all stay empty, which is why the new icons appear nowhere in the browser/Bram webview.
- No `<link rel="icon">` / `apple-touch-icon` — so the browser tab and iOS home screen have no favicon.

Net: #3 fixed the icon paths *inside* the manifest, but the manifest is still unwired from the page, so the icons are invisible in every browser surface (only reachable by hitting `/icons/icon-512.png` directly).

# After

Wire the manifest and favicons into `index.html`'s `<head>` using **relative** paths (no leading `/`), which resolve correctly against the app root both locally and under the GitHub Pages subpath (`ludwa6.github.io/garden_tour/`). Add after the `<title>` (line 6):

```html
<link rel="manifest" href="manifest.json">
<link rel="icon" type="image/png" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<meta name="theme-color" content="#0ea5e9">
```

Result: browser loads the manifest (install + DevTools Manifest view populated), the leaf shows as the tab favicon and iOS home-screen icon, and `theme-color` matches the manifest.

**Options considered**

- **[chosen]** Static relative `<link>` tags in `<head>`. Simplest; relative resolution handles the Pages subpath without code. Deliberately avoids the leading-slash absolute-path trap that breaks navigation on Pages (the same class of bug being filed separately for the "Back to Map" buttons, and already open as #4 for the service worker).
- Inject the links dynamically in the existing `basePath` script (mirroring the CSS/SW pattern) — rejected: more code for no benefit; relative static links already resolve correctly.

**Files changed:** `index.html`.

**Verification:** serve locally, confirm DevTools → Application → Manifest lists name + both icons with no errors, the tab shows the leaf favicon, and Lighthouse "installable" passes (user to confirm in-browser).
