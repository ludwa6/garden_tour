# Before

The repo carries several files that no code references and that clutter the working tree (per issue #2):

- `script.js` — 14 bytes, contains only the literal `404: Not Found` (a botched download artifact); referenced by no HTML.
- `observations.json` — placeholder data (`Rose Garden`, `Herb Bed`, `Pond Area`) that no code reads; real observation data comes live from the iNaturalist API and is cached to `localStorage["erc_observations"]`.
- `sw.js` — a one-line shim (`importScripts('./service-worker.js')`); `index.html:32` registers `service-worker.js` directly, so this is unused. The only repo reference to `sw.js` is its own self-comment.
- `garden-tour-app-20250830-1445.tar.gz`, `garden-tour-backup-20250830-1356.tar.gz` — committed binary backups.
- `Backups/app.old.js` — superseded copy.
- `attached_assets/` — Replit screenshot/log detritus (5 files: pasted logs + a PNG screenshot).

Grep confirmation already run — no `*.html`/`*.js` app references to `script.js`, `observations.json`, or `sw.js`.

# After

All of the above removed from version control via `git rm`; working tree reflects only files the app actually uses.

**Options considered**

- **[chosen]** Delete outright — git history preserves anything we ever need to recover.
- Move to an `archive/` folder — rejected: just relocates clutter; git history already is the archive.
- `.gitignore` only — rejected: they're already committed; ignoring doesn't remove them.

**Files removed:** `script.js`, `observations.json`, `sw.js`, `garden-tour-app-20250830-1445.tar.gz`, `garden-tour-backup-20250830-1356.tar.gz`, `Backups/app.old.js`, and the entire `attached_assets/` folder (with `Backups/` left empty and thus gone too).

**Verification after deletion:** serve the repo (`python3 -m http.server`), open localhost, confirm the app loads and the Leaflet map renders.
