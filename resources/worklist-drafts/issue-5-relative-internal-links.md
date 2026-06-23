# Before

`tripplan.html` and `userjournals.html` set a dynamic `<base href>` (`/` on localhost, `/garden_tour/` on GitHub Pages — tripplan.html:10-16, same in userjournals.html). Relative links resolve correctly against that base in both environments; **absolute** links (leading `/`) bypass the base and resolve against the host root, so on Pages they land on `ludwa6.github.io/...` instead of `ludwa6.github.io/garden_tour/...` — off the app.

Issue #5 reported the "Back to Map" buttons, but the grep shows the bug hits **every** absolute internal link in both files (12 total):

**tripplan.html**
- `:39` `🏡 Back to Map` → `/index.html`
- `:60` `🗺️ Explore the Map` → `/index.html`
- `:109` `🔍 View Details` → `/poi/detail.html?obs=...`

**userjournals.html**
- `:42` `🏡 Back to Map` → `/index.html`
- `:72` `🗺️ Start Exploring` → `/index.html`
- `:184` `🔍 View Full Details` → `/poi/detail.html?obs=...`
- `:284` `🏡 Home` → `/index.html`
- `:285` `🌿 My Trip` → `/tripplan.html`
- `:286` `🔍 Sample POI` → `/poi/detail.html?obs=123456`
- `:287` `⚙️ Admin` → `/admin.html`
- `:288` `📒 Journals` → `/userjournals.html`
- `:289` `🔗 QR Admin` → `/qr_admin.html`

# After

Make every internal link relative by dropping the leading `/` (e.g. `href="/index.html"` → `href="index.html"`, `href="/poi/detail.html?..."` → `href="poi/detail.html?..."`). The existing `<base>` tag then routes them to the app root in both environments.

The two `<base href="/...">` declarations (tripplan/userjournals lines 12 & 14) are **left unchanged** — those are the base itself, not navigation.

**Options considered**

- **[chosen]** Relative hrefs + existing `<base>`. One-character fix per link; the base tag already exists to make this work. Same fix family as #4 (service worker) and the manifest wiring.
- Build hrefs from a JS basePath — rejected: the `<base>` tag already solves it; no JS needed.

**Files changed:** `tripplan.html`, `userjournals.html`.

**Verification:**
- `grep -rn 'href="/' tripplan.html userjournals.html` returns only the two `<base href>` lines, no `<a href="/...">`.
- Serve locally and click through Back to Map / Home / Explore / footer nav / POI links; all stay within the app.
- User to confirm on the deployed Pages URL.
