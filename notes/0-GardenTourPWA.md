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

---

Got it — thank you for clarifying. We should keep the Notes workflow intact (tripplan.html for logging personal notes, and userjournals.html for aggregated shared notes). The rollback should only remove the broken Google Sheets integration experiment, not the core Notes features.

Here’s what I’ll do:

✅ Keep tripplan.html and userjournals.html exactly as they were, with full Notes functionality.

✅ Roll back index.html and qr_admin.html to their clean state, but without removing any Notes-related links or affordances.

❌ Strip out only the parts where Notes were miswired to Google Sheets.

👉 Next step: I’ll prepare updated drop‑in replacements for index.html and qr_admin.html that (a) restore their clean baseline map + QR admin functionality, and (b) keep all Notes functionality intact (as it connects with tripplan/userjournals).

Do you want me to show you those two corrected versions now, in full, as drop‑ins?



### 15_notes-rollback-plan.md

# Rollback while keeping Notes (client-side only)

Goal: remove Google Sheet posting, retain Notes UX (tripplan → export/share → userjournals).

Safe sequence

Back up current files (copy to /backup_YYYY-MM-DD/).

Replace index.html and qr_admin.html with the pre‑Sheets versions already in this canvas (keep their filenames).

Drop in notes-core.js (module 16) and link it from pages that use Notes.

Replace tripplan.html with modules 17A–C.

Replace userjournals.html with modules 18A–C.

Test offline (toggle airplane mode): add text/photo notes, export HTML/JSON, share (if supported), then reopen userjournals.html and verify entries render.

If anything breaks, restore from step 1 backup.


### 16_notes-core.js

```
<!-- Include this on pages that need Notes (tripplan, userjournals, any POI page). -->
<script>
(() => {
  const NOTES_KEY = 'tripNotes';
  const META_KEY = 'tripMeta';

  function _load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function _save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

  function getMeta() { return _load(META_KEY, { title: 'My Trip Journal', startedAt: new Date().toISOString() }); }
  function setMeta(meta) { _save(META_KEY, { ...getMeta(), ...meta }); }

  function getAllNotes() { return _load(NOTES_KEY, {}); }
  function getNotesForObs(obsId) { const n = getAllNotes(); return n[obsId] || []; }
  function clearAllNotes() { _save(NOTES_KEY, {}); }

  async function fileToDataURL(file) {
    if (!file) return null;
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  }

  function addNote(obsId, { text = '', photoDataUrl = null, title = '' } = {}) {
    if (!obsId) throw new Error('obsId required');
    const notes = getAllNotes();
    const id = (self.crypto?.randomUUID?.() || Date.now().toString());
    const entry = { id, obsId: String(obsId), ts: new Date().toISOString(), title, text, photo: photoDataUrl };
    if (!notes[obsId]) notes[obsId] = [];
    notes[obsId].push(entry);
    _save(NOTES_KEY, notes);
    return entry;
  }

  function toHTML({ title, notesByObs }) {
    const esc = (s) => String(s||'').replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
    const groups = Object.keys(notesByObs).sort();
    const parts = [
      '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
      `<title>${esc(title)}</title>`,
      '<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;margin:1rem;}h1{margin:0 0 .5rem} .group{margin:1rem 0;padding:1rem;border:1px solid #eee;border-radius:12px} .note{margin:.5rem 0;padding:.5rem;border-radius:8px;background:#fafafa} .note time{font-size:.85em;color:#666} img{max-width:100%;height:auto;border-radius:8px;margin-top:.25rem}</style>',
      '</head><body>',
      `<h1>${esc(title)}</h1>`
    ];
    for (const k of groups) {
      parts.push(`<div class="group"><h2>Observation ${esc(k)}</h2>`);
      for (const n of notesByObs[k]) {
        parts.push(`<div class="note"><time>${esc(n.ts)}</time>${n.title?`<div><strong>${esc(n.title)}</strong></div>`:''}${n.text?`<div>${esc(n.text)}</div>`:''}${n.photo?`<div><img src="${n.photo}" alt="photo"></div>`:''}</div>`);
      }
      parts.push('</div>');
    }
    parts.push('</body></html>');
    return parts.join('');
  }

  function download(filename, mime, content) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function exportJournalHTML(filename = 'trip_journal.html') {
    const meta = getMeta();
    const notes = getAllNotes();
    const html = toHTML({ title: meta.title || 'My Trip Journal', notesByObs: notes });
    download(filename, 'text/html', html);
  }

  async function exportJournalJSON(filename = 'trip_journal.json') {
    const payload = { meta: getMeta(), notes: getAllNotes() };
    download(filename, 'application/json', JSON.stringify(payload, null, 2));
  }

  async function shareJournalHTML() {
    const meta = getMeta();
    const html = toHTML({ title: meta.title || 'My Trip Journal', notesByObs: getAllNotes() });
    const blob = new Blob([html], { type: 'text/html' });
    if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'trip_journal.html', { type: 'text/html' })] })) {
      const file = new File([blob], 'trip_journal.html', { type: 'text/html' });
      return navigator.share({ title: meta.title || 'My Trip Journal', text: 'My garden trip journal', files: [file] });
    }
    // Fallback to download
    download('trip_journal.html', 'text/html', html);
  }

  // Expose
  window.TripNotes = { getMeta, setMeta, getAllNotes, getNotesForObs, addNote, clearAllNotes, exportJournalHTML, exportJournalJSON, shareJournalHTML };
})();
</script>
```

### 17A_tripplan-head.html

```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Trip Plan</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
<header><h1>My Trip Plan</h1></header>
<main>
```

### 17B_tripplan-body.html

```
<section>
  <label>Trip Title
    <input id="tripTitle" type="text" placeholder="My Trip Journal">
  </label>
</section>

<section id="poiList">
  <h2>Planned Observations</h2>
  <p class="muted">Pick one, add a note or photo. (This list populates from your current plan if available; otherwise enter an ID manually.)</p>
  <div id="obsChooser"></div>
  <div class="inline-form">
    <input id="manualObsId" type="text" placeholder="Or enter Observation ID">
  </div>
</section>

<section id="noteForm">
  <h2>Add Note</h2>
  <label>Title <input id="noteTitle" type="text" placeholder="Optional"></label>
  <label>Text <textarea id="noteText" rows="4" placeholder="What did you see?"></textarea></label>
  <label>Photo <input id="notePhoto" type="file" accept="image/*" capture="environment"></label>
  <div>
    <button id="saveNote">Save Note</button>
  </div>
</section>

<section>
  <h2>My Trip Journal</h2>
  <div id="notesView"></div>
  <div class="actions">
    <button id="exportHtml">Export HTML</button>
    <button id="exportJson">Export JSON</button>
    <button id="shareHtml">Share</button>
  </div>
</section>
```

### 17C_tripplan-scripts.html

```
</main>
<footer><a href="index.html">⬅ Back to Map</a> · <a href="userjournals.html">Open My Journals</a></footer>

<!-- Notes core -->
<!-- (module 16 must be included on this page) -->

<script>
  // Initialize from stored plan if present
  const obsChooser = document.getElementById('obsChooser');
  const manualObsId = document.getElementById('manualObsId');
  const noteTitle = document.getElementById('noteTitle');
  const noteText = document.getElementById('noteText');
  const notePhoto = document.getElementById('notePhoto');
  const notesView = document.getElementById('notesView');
  const tripTitle = document.getElementById('tripTitle');

  // Apply stored meta
  const meta = TripNotes.getMeta();
  tripTitle.value = meta.title || '';
  tripTitle.addEventListener('input', () => TripNotes.setMeta({ title: tripTitle.value }));

  // Populate chooser from filteredObservations (if user came from map)
  const stored = localStorage.getItem('filteredObservations');
  let plan = [];
  try { plan = stored ? JSON.parse(stored) : []; } catch {}
  if (Array.isArray(plan) && plan.length) {
    const select = document.createElement('select');
    select.id = 'obsSelectPlan';
    select.innerHTML = '<option value="">Select an observation</option>' + plan.map((o, i)=>`<option value="${o.id}">${o.title || 'Observation'} (#${o.id})</option>`).join('');
    obsChooser.appendChild(select);
  } else {
    obsChooser.innerHTML = '<p class="muted">No planned observations loaded.</p>';
  }

  function currentObsId() {
    const sel = document.getElementById('obsSelectPlan');
    return sel && sel.value ? sel.value : (manualObsId.value || '').trim();
  }

  function renderNotes() {
    const byObs = TripNotes.getAllNotes();
    const keys = Object.keys(byObs);
    if (!keys.length) { notesView.innerHTML = '<p class="muted">No notes yet.</p>'; return; }
    notesView.innerHTML = keys.map(k => {
      const items = byObs[k].map(n => `
        <div class="note">
          <time>${n.ts}</time>
          ${n.title?`<div><strong>${n.title}</strong></div>`:''}
          ${n.text?`<div>${n.text}</div>`:''}
          ${n.photo?`<div><img src="${n.photo}" alt="photo"></div>`:''}
        </div>`).join('');
      return `<div class="group"><h3>Observation ${k}</h3>${items}</div>`;
    }).join('');
  }

  renderNotes();

  document.getElementById('saveNote').addEventListener('click', async () => {
    const obsId = currentObsId();
    if (!obsId) { alert('Select or enter an Observation ID first'); return; }
    let dataUrl = null;
    const file = notePhoto.files?.[0];
    if (file) dataUrl = await (async f => new Promise((res, rej)=>{ const r = new FileReader(); r.onload = ()=>res(r.result); r.onerror = rej; r.readAsDataURL(f); }))(file);
    TripNotes.addNote(obsId, { title: noteTitle.value, text: noteText.value, photoDataUrl: dataUrl });
    noteTitle.value = ''; noteText.value = ''; notePhoto.value='';
    renderNotes();
  });

document.getElementById('exportHtml').addEventListener('click', () => {
    const data = JSON.parse(localStorage.getItem('tripNotes') || '[]');
    const html = exportNotesAsHTML(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'My_Trip_Journal.html';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('exportJson').addEventListener('click', () => {
    const data = JSON.parse(localStorage.getItem('tripNotes') || '[]');
    const json = exportNotesAsJSON(data);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'My_Trip_Journal.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('shareNotes').addEventListener('click', async () => {
    const data = JSON.parse(localStorage.getItem('tripNotes') || '[]');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Trip Journal',
          text: 'Check out my notes from the tour!',
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing', err);
      }
    } else {
      alert('Web Share API not supported. Please use Export instead.');
    }
  });

  renderNotes();
</script>
</body>
</html>
```

### 18c_userjournals-scripts.html

```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>User Journals</title>
  <link rel="stylesheet" href="styles.css"/>
</head>
<body>
  <header>
    <h1>Shared Trip Journals</h1>
    <nav>
      <a href="index.html">🏠 Map</a>
      <a href="tripplan.html">📝 My Trip Plan</a>
      <a href="userjournals.html" class="active">📚 User Journals</a>
    </nav>
  </header>

  <main>
    <section id="journalsSection">
      <p>Loading shared journals...</p>
    </section>
  </main>

  <footer>
    <a href="qr_admin.html">QR Admin</a>
    <a href="admin.html">🔧 Admin Dashboard</a>
    <span class="footer-sep"> :: </span>
    <a href="https://www.inaturalist.org/projects/197410" target="_blank" rel="noopener noreferrer">
      View Project at iNaturalist
    </a>
  </footer>

  <script>
    // Simulated fetch from server or shared storage
    async function fetchSharedJournals() {
      // Placeholder: could be replaced with API/DB call later
      return JSON.parse(localStorage.getItem("sharedJournals") || "[]");
    }

    function renderJournals(list) {
      const section = document.getElementById('journalsSection');
      if (!list.length) {
        section.innerHTML = "<p>No shared journals yet. Be the first to share your trip notes!</p>";
        return;
      }

      section.innerHTML = "";
      list.forEach((journal, idx) => {
        const wrapper = document.createElement('article');
        wrapper.className = "journal";

        const title = document.createElement('h2');
        title.textContent = journal.title || `Journal ${idx+1}`;
        wrapper.appendChild(title);

        const meta = document.createElement('p');
        meta.className = "meta";
        meta.textContent = `Shared on ${journal.date || new Date().toLocaleDateString()}`;
        wrapper.appendChild(meta);

        const notesList = document.createElement('ul');
        journal.notes.forEach(note => {
          const li = document.createElement('li');
          if (note.text) {
            li.textContent = note.text;
          }
          if (note.photo) {
            const img = document.createElement('img');
            img.src = note.photo;
            img.alt = "Journal photo";
            img.className = "journal-photo";
            li.appendChild(img);
          }
          notesList.appendChild(li);
        });
        wrapper.appendChild(notesList);

        section.appendChild(wrapper);
      });
    }

    document.addEventListener("DOMContentLoaded", async () => {
      const journals = await fetchSharedJournals();
      renderJournals(journals);
    });
  </script>
</body>
</html>
```

### 19c_admin.html

```
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin Dashboard</title>
  <link rel="stylesheet" href="styles.css"/>
</head>
<body>
  <header>
    <h1>🔧 Admin Dashboard</h1>
    <nav>
      <a href="index.html">🏠 Map</a>
      <a href="tripplan.html">📝 My Trip Plan</a>
      <a href="userjournals.html">📚 User Journals</a>
      <a href="qr_admin.html">QR Admin</a>
    </nav>
  </header>

  <main>
    <section>
      <h2>📊 Project Stats</h2>
      <div id="stats">Loading stats...</div>
    </section>

    <section>
      <h2>🧾 Export Data</h2>
      <button id="exportObservations">Export Observations JSON</button>
      <button id="exportJournals">Export Journals JSON</button>
    </section>

    <section>
      <h2>⚙️ Admin Tools</h2>
      <ul>
        <li><a href="qr_admin.html">QR Code Manager</a></li>
        <li><a href="index.html">Return to Map</a></li>
      </ul>
    </section>
  </main>

  <footer>
    <a href="qr_admin.html">QR Admin</a>
    <a href="admin.html" class="active">🔧 Admin Dashboard</a>
    <span class="footer-sep"> :: </span>
    <a href="https://www.inaturalist.org/projects/197410" target="_blank" rel="noopener noreferrer">
      View Project at iNaturalist
    </a>
  </footer>

  <script>
    function loadStats() {
      const obs = JSON.parse(localStorage.getItem("observations") || "[]");
      const journals = JSON.parse(localStorage.getItem("sharedJournals") || "[]");
      const statsDiv = document.getElementById("stats");
      statsDiv.innerHTML = `
        <p>Total Observations: ${obs.length}</p>
        <p>Total Shared Journals: ${journals.length}</p>
      `;
    }

    document.getElementById("exportObservations").addEventListener("click", () => {
      const obs = localStorage.getItem("observations") || "[]";
      const blob = new Blob([obs], {type: "application/json"});
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "observations.json";
      link.click();
    });

    document.getElementById("exportJournals").addEventListener("click", () => {
      const journals = localStorage.getItem("sharedJournals") || "[]";
      const blob = new Blob([journals], {type: "application/json"});
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "sharedJournals.json";
      link.click();
    });

    document.addEventListener("DOMContentLoaded", loadStats);
  </script>
</body>
</html>
```

### admin_dashboard.css (drop-in file, or add to styles.css)
✨ What this adds:

* Clean grid-based layout for sections.

* Card-style panels with rounded corners + subtle shadows.

* Polished buttons with hover states.

* Unified header/footer color scheme (dark slate + light text).

* Responsive design (single-column, mobile-friendly).

```
/* Admin Dashboard Styling */

/* General Layout */
body {
  font-family: system-ui, sans-serif;
  background: #fafafa;
  color: #222;
  margin: 0;
  padding: 0;
}

header {
  background: #2c3e50;
  color: white;
  padding: 1rem;
}

header h1 {
  margin: 0;
  font-size: 1.6rem;
}

header nav {
  margin-top: 0.5rem;
}

header nav a {
  color: #ecf0f1;
  text-decoration: none;
  margin-right: 1rem;
  font-weight: 500;
}

header nav a:hover,
header nav a.active {
  text-decoration: underline;
}

main {
  max-width: 900px;
  margin: 1.5rem auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

section {
  background: white;
  padding: 1.2rem;
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.08);
}

section h2 {
  margin-top: 0;
  font-size: 1.3rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
  margin-bottom: 0.8rem;
}

/* Buttons */
button {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  margin-right: 0.5rem;
  transition: background 0.2s ease;
}

button:hover {
  background: #2980b9;
}

/* Footer */
footer {
  text-align: center;
  background: #2c3e50;
  color: white;
  padding: 0.8rem;
  margin-top: 2rem;
}

footer a {
  color: #ecf0f1;
  text-decoration: none;
  margin: 0 0.5rem;
}

footer a.active {
  font-weight: bold;
  text-decoration: underline;
}

.footer-sep {
  margin: 0 0.5rem;
  opacity: 0.6;
}
```

### userjournals.css

✨ What this does:

* Harmonizes colors + layout with admin-dashboard.css (slate header/footer, card sections).

* Adds hover-highlighted journal entries so scanning logs is easy.

* Consistent rounded cards + shadows across both dashboards.

* Clean button styles (green theme for journals, blue theme for admin).

```
/* User Journals Styling */

/* General Layout */
body {
  font-family: system-ui, sans-serif;
  background: #fdfdfd;
  color: #222;
  margin: 0;
  padding: 0;
}

header {
  background: #34495e;
  color: white;
  padding: 1rem;
}

header h1 {
  margin: 0;
  font-size: 1.6rem;
}

header nav {
  margin-top: 0.5rem;
}

header nav a {
  color: #ecf0f1;
  text-decoration: none;
  margin-right: 1rem;
  font-weight: 500;
}

header nav a:hover,
header nav a.active {
  text-decoration: underline;
}

/* Main Layout */
main {
  max-width: 900px;
  margin: 1.5rem auto;
  padding: 0 1rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

section {
  background: white;
  padding: 1.2rem;
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.08);
}

section h2 {
  margin-top: 0;
  font-size: 1.3rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
  margin-bottom: 0.8rem;
}

/* Journals List */
.journal-entry {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 1rem;
  background: #fafafa;
  transition: background 0.2s ease;
}

.journal-entry:hover {
  background: #f0f8ff;
}

.journal-entry h3 {
  margin-top: 0;
  font-size: 1.1rem;
}

.journal-entry small {
  color: #666;
}

/* Buttons */
button {
  background: #27ae60;
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  margin-right: 0.5rem;
  transition: background 0.2s ease;
}

button:hover {
  background: #1e8449;
}

/* Footer */
footer {
  text-align: center;
  background: #34495e;
  color: white;
  padding: 0.8rem;
  margin-top: 2rem;
}

footer a {
  color: #ecf0f1;
  text-decoration: none;
  margin: 0 0.5rem;
}

footer a.active {
  font-weight: bold;
  text-decoration: underline;
}

.footer-sep {
  margin: 0 0.5rem;
  opacity: 0.6;
}
```

