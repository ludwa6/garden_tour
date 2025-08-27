 Garden Tour Pwa — Modular Documentation Bundle

This document has been split into small, copy/paste-friendly **modules** so you can assemble a single long-form `garden_tour.md` locally. Each module below includes a suggested filename (copy the block beginning with `--- filename ---` and paste into a file with that name), followed by the module content.

\--- 01\_project-overview\.md ---

# 01 — Project Overview

**Goal:** build a field-ready Progressive Web App (PWA) for garden and nature tours that works offline, serves contextual POI pages via QR links, and lets visitors record notes and photos into a "My Trip Journal" for export and optional server sync.

**Scope:**

* Admin tools to generate QR codes and create offline packs per POI.
* Visitor PWA that installs on devices, reads offline packs if present, allows notes (text + photos + geotag), and exports/shares journal entries.

**Audience:** garden staff, volunteers, visitors, community scientists.

---

\--- 02\_current-features.md ---

# 02 — Current Features (summary)

## QR Admin (admin-facing)

* POI dropdown selector now populated dynamically from observations.json or API endpoint.

* Client-side QR code generation and preview.

* Copy POI link to clipboard.

* Create offline pack ZIP: index.html, qr.png, assets.json.

* Optional server upload (POST zip to API).

* Admin.html features now documented:

	* POI detail editing: title, description, tags.

	* Offline template editor with placeholders ({{POI_TITLE}}, {{POI_DESC}}).

	* Status log for generation and upload progress.

## Offline Pack Structure

```
assets/
  offline/
    :id/
      index.html
      qr.png
      assets.json
```

## PWA Behavior

* Installable to mobile homescreen.
* Offline-first: can use local offline packs served from `/assets/offline/:id` on the host.
* Notes saved locally (IndexedDB) and optionally synced when online.

---

\--- 03\_roadmap.md ---

# 03 — Roadmap (concise)

## Phase 1 — Prototype (done)

* Basic PWA shell, QR admin prototype, client-side ZIP packs.

## Phase 2 — In progress

* Mobile-first UI improvements.
* Editable offline templates and metadata.
* Optional server-side deployment for unpacking offline packs.
* Field testing in low-connectivity conditions.

## Phase 3 — Planned

* Visitor notes/photos (My Trip Journal), exports, community contributions (iNaturalist/GBIF integration), gamification options.

## Phase 4 — Future

* Cross-garden federation, advanced visualizations and analytics.

---

\--- 04\_issues\_and\_todo.md ---

# 04 — Current Issues & To-do

* Fix layout/alignment issues in the current `qr_admin.html` (preview panel vs controls).
* Avoid sending monolithic files in chat — keep code split into parts.
* Decide hosting workflow: manual ZIP upload vs server-unpack API.
* Add metadata flags in admin to control visitor note affordance and moderation.


\--- 05\_wireframes.md ---

# 05 — Wireframes (text versions)

## Admin Interface (QR Admin)

```
 ---------------------------------------------------
|  QR Admin — Generate QR & Offline Pack            |
 ---------------------------------------------------
| Select Observation: [Dropdown v] (populated dynamically)  |
| POI ID input / Search                               |
| Detail URL: [___________________________]         |
 ---------------------------------------------------
| [ Generate QR ] [ Download Pack ] [ Save Server ] |
| [ Copy Link ]                                     |
 ---------------------------------------------------
| POI Metadata Editor (title, description, tags)     |
| Offline Template (editable textarea)              |
 ---------------------------------------------------
| QR Preview   |  Preview Link: [readonly URL]      |
|   [####]     |                                    |
 ---------------------------------------------------
| Status Log [idle/generating/ready/error...]       |
 ---------------------------------------------------
```

## Visitor-Facing App (Mobile PWA)

```
 ---------------------------------------------------
|  Garden Tours (PWA)                               |
 ---------------------------------------------------
| [Menu ☰] [Offline Packs ✓] [Search 🔍]            |
 ---------------------------------------------------
|  Home:                                           |
|   • Start Tour                                   |
|   • Map of Garden                                |
|   • Points of Interest (list)                    |
 ---------------------------------------------------
|  POI Detail Page                                 |
|   [POI Title]                                    |
|   [Image/QR if offline]                          |
|   Description text...                             |
|   [ Add Note ✎ ]  [ Listen 🔊 ]  [ Back ]         |
 ---------------------------------------------------
|  Add Note Modal                                  |
|   • Text input                                   |
|   • Attach photo(s) [Camera / Library]           |
|   • Geotag toggle (auto-locate / manual)         |
|   • Save (stores locally if offline)             |
 ---------------------------------------------------
|  My Trip Journal                                 |
|   • List of notes grouped by POI and time        |
|   • Export / Share [ZIP / PDF / JSON / CSV]      |
|   • Sync status per note (synced / pending)      |
 ---------------------------------------------------
```

---

\--- 06\_workflow-diagram.md ---

# 06 — Workflow Diagram (ASCII)

```
Admin (Create POI, generate pack)                     Hosting / Server
           |                                                   |
           | generate offline pack (zip)                        | (optional) receive zip via API
           |---> [Client-side ZIP] -----> (download) -----> manual upload to hosting
           |                                                   |
           |---> [POST zip to API] -----> (server unpacks to) /assets/offline/:id
           |                                                   |
 visitor scans QR / opens POI URL                             |
           |                                                   |
           +--> PWA checks for local offline pack at /assets/offline/:id
                 |                       |
                 | yes (offline pack present) | no (must fetch from network)
                 v                         v
             show offline POI page         fetch POI page from network
                 |                         |
  [Visitor reads content]                  [Visitor reads content]
                 |
  [Visitor adds Note (text + photos + geotag)]
                 |
  Save note locally (IndexedDB / local file store)
                 |
  If online -> sync queue uploads note to server (optional)
  If offline -> note marked pending; sync when online
                 |
  My Trip Journal aggregates notes -> user can Export/Share
                 |
  Export options: ZIP (images + JSON), PDF, JSON, CSV, GeoJSON
```

---

\--- 07\_customer-experience-map.md ---

# 07 — Customer Experience Map (detailed)

This module maps the visitor journey, UX expectations, edge-cases and suggested affordances.

## A. Discovery

* Touchpoints: website, signage, QR near POI, flyers.
* Expectations: fast load, readable title, offline indicator.
* Mitigations: compressed assets, clear labeling, alt text.

## B. Entry to POI

* Expectations: fast display, Add Note, audio playback.
* Affordances: large primary buttons, offline badge, back nav.
* Edge cases: no camera/location — provide manual input fallback.

## C. Creating a Note

* Flow: Add Note → text → photos → geotag → Save.
* Affordances: image compression, thumbnail preview, consent dialogs.

## D. My Trip Journal

* Expectations: filter, map view, grouped notes, export and edit.

## E. Syncing & Sharing

* Per-note sync indicators, retry strategies, export formats, privacy controls.

## F. Post-Visit

* Shareable URL (server-backed) or downloadable bundle, integration opt-ins for iNaturalist/GBIF.

---

\--- 08\_data-model.md ---

# 08 — Data Model (notes) & Storage

Example note JSON:

```json
{
  "note_id": "uuid-1234",
  "poi_id": "poi-1001",
  "created_at": "2025-08-26T12:34:56Z",
  "text": "Saw a bumblebee on the lavender",
  "photos": ["photo-uuid-1.jpg", "photo-uuid-2.jpg"],
  "location": {"lat": 38.7223, "lng": -9.1393},
  "synced": false
}
```

**Storage recommendations:**

* IndexedDB (localForage wrapper) for structured data and thumbnails.
* Store compressed image blobs; keep thumbnails separate for fast listing.
* Sync queue table with `pending|uploading|synced|failed` states.

---

\--- 09\_implementation-guidance.md ---

# 09 — Implementation Considerations & Recommendations

## Offline-first storage

* Use IndexedDB/localForage; maintain sync queue and summary index.

## Images & media

* Compress & resize client-side (target 800–1200px long edge).
* Limit attachments per note (e.g., default 3).

## Sync API suggestions

* `POST /api/offline-pack` — accept multipart/form-data zip and unpack to `/assets/offline/:id`.
* `POST /api/notes` — accept note JSON + images.
* `GET /api/notes?poi_id=...` — moderation or public gallery.

## Privacy & consent

* Explicit camera and location consent; opt-in server upload for photos.

## UX polish

* Inline help, progress toasts, clear offline/online indicators.

---

\--- 10\_export-and-sharing.md ---

# 10 — Export & Sharing (user-facing)

Supported export formats:

* ZIP (notes.json + images)
* PDF (formatted journal)
* JSON (machine-readable)
* CSV (text-only)
* GeoJSON / KML / GPX (for geotagged notes)
* OS share sheet via `navigator.share()` when available

When exporting, include a small `README.md` inside ZIP explaining fields and a manifest file.

---

\--- 11\_api-contracts.md ---

# 11 — Minimal API Contracts (examples)

## 1) Accept offline pack

**POST /api/offline-pack**

* Content-Type: multipart/form-data
* Fields: `id`, `zipfile` (binary)
* Behavior: validate ID, unzip to `/assets/offline/:id/`, verify presence of `index.html`.
* Response: 200 `{ "ok": true, "path": "/assets/offline/:id/" }` or 4xx/5xx error.

## 2) Accept notes

**POST /api/notes**

* Content-Type: multipart/form-data or application/json
* Fields (json): `note_id`, `poi_id`, `created_at`, `text`, `location`, `attachments` (optional multipart)
* Response: 201 `{ "ok": true, "note_id": "uuid-1234", "synced_at": "..." }`

## 3) Retrieve notes

**GET /api/notes?poi\_id=poi-1001**

* Response: 200 JSON array of notes (pagination)

**Security & moderation:** accept anonymous notes, but flag images for moderation if necessary.

---

\--- 12\_next-actions.md ---

# 12 — Next Actions (updated)

1. Ensure the POI dropdown in QR Admin populates from the observations JSON or API.

1. Map all Admin.html functions to the documentation (metadata editor, template editor, QR preview, status log).

1. Prototype Add Note flow in the visitor PWA (modal → IndexedDB → local preview → export ZIP).

1. Field test: 3–5 POIs, test QR generation, offline pack download, Add Note functionality.

1. Iterate on My Trip Journal layout, export templates, and sync indicators.

1. Optionally implement Express server endpoints for offline pack uploads and note syncing.

\--- 13\_appendix\_qr\_admin\_parts.md ---

# 13 — Appendix: QR Admin code & assembly guidance

**Important:** To avoid exceeding file-length limits, do **not** paste entire `qr_admin.html` here. Instead follow this plan:

1. Ask for the QR Admin code in small numbered parts (e.g., `qr_admin.part01.html`, `qr_admin.part02.html`, ...).
2. Each part will contain a short contiguous chunk of the file (head/styles, body, config & libs, main JS, footer).
3. To assemble locally use: `cat qr_admin.part01.html qr_admin.part02.html ... > qr_admin.html` or paste in-order into a single file.

If you want, I can now add the Express server snippet as a separate module (e.g., `express_server_offline_unpack.md`) — say **yes** and I will create it as one small module you can copy/paste.

---

## Assembly hint

To produce a single `garden_tour.md` locally, create files named as above (01\_project-overview\.md ... 13\_appendix\_qr\_admin\_parts.md) and concatenate:

```bash
cat 01_project-overview.md 02_current-features.md 03_roadmap.md \
    04_issues_and_todo.md 05_wireframes.md 06_workflow-diagram.md \
    07_customer-experience-map.md 08_data-model.md 09_implementation-guidance.md \
    10_export-and-sharing.md 11_api-contracts.md 12_next-actions.md 13_appendix_qr_admin_parts.md \
    > garden_tour.md
```

---

If you want the small Express server snippet now, reply **"Express module please"** and I'll add `14_express_server.md` as one additional module (short, copy/paste ready). Otherwise tell me which other focused module you want next (SVG flowchart, Add Note UX spec page, or chunked qr\_admin parts).