// app.js
/* global L, omnivore */

// --- Helpers for robust asset URLs ---
function makeAssetUrl(relativePath) {
  return new URL(relativePath, window.location.origin + window.appBase).href;
}

// In-app POI detail page for an observation. Same construction as qr_admin.js,
// so a scanned QR code and a tapped card land on the identical URL under any
// deploy root (/ locally, /garden_tour/ on GitHub Pages).
function detailUrl(obsId) {
  return makeAssetUrl('poi/detail.html?obs=' + encodeURIComponent(obsId));
}

// Escape API-derived strings before they reach innerHTML. Project 197410 is an
// iNaturalist *collection* project — it auto-includes any observation matching a
// place_id rule, with no membership or curation — so species_guess is free text
// from an untrusted observer. Quotes are escaped as well as angle brackets: the
// textContent round-trip helper used elsewhere in this repo does not escape them
// and so is unsafe for attribute values. See #15.
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// --- Setup Map ---
const map = L.map('map').setView([37.1, -8.6], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// --- Load Vale da Lama perimeter from KML ---
omnivore.kml(makeAssetUrl('Q.VdL-Perimeter.kml'))
  .on('ready', function (e) {
    map.fitBounds(e.target.getBounds());
    scheduleRefreshMapView();
  })
  .addTo(map);

// --- Marker cluster group ---
const markers = L.markerClusterGroup();
map.addLayer(markers);

// --- Global state ---
let allObservations = [];
let currentObservations = [];
let currentRange = 'today';

// --- Helpers to keep map visible & correct ---
function refreshMapView() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return;

  map.invalidateSize();

  const b = markers.getBounds && markers.getBounds();
  if (b && b.isValid && b.isValid()) {
    map.fitBounds(b, { padding: [50, 50] });
  } else {
    map.setView([37.146, -8.642], 14);
  }
}

function scheduleRefreshMapView() {
  requestAnimationFrame(() => {
    requestAnimationFrame(refreshMapView);
  });
}

// --- Observe map element & list changes ---
(function setupObservers() {
  const mapEl = document.getElementById('map');
  if (mapEl && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(() => scheduleRefreshMapView());
    ro.observe(mapEl);
  }
  window.addEventListener('resize', scheduleRefreshMapView);

  const listDiv = document.getElementById('observations');
  if (listDiv) {
    const mo = new MutationObserver(() => scheduleRefreshMapView());
    mo.observe(listDiv, { childList: true });
  }
})();

// --- Fetch iNaturalist observations ---
async function fetchObservations() {
  const PROJECT_ID = 197410;
  const url = "https://api.inaturalist.org/v1/observations" +
    "?project_id=" + PROJECT_ID +
    "&order=desc&order_by=observed_on" +
    "&per_page=200" +
    "&quality_grade=any";

  console.log("[iNat] URL:", url);
  const res = await fetch(url);
  console.log("[iNat] Status:", res.status, res.statusText);

  const json = await res.json();
  allObservations = json.results || [];
  console.log("[iNat] Loaded results:", allObservations.length);

  renderObservations();
}

// --- Render observations based on filter ---
function renderObservations() {
  markers.clearLayers();
  const listDiv = document.getElementById('observations');
  if (!listDiv) return;
  listDiv.innerHTML = "";

  const now = new Date();
  let cutoff = null;

  if (currentRange === 'today') {
    cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (currentRange === 'week') {
    cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    cutoff.setDate(cutoff.getDate() - 7);
  }

  let count = 0;
  currentObservations = [];
  const minimalObs = [];

  allObservations.forEach(obs => {
    let obsDate = null;
    if (obs.observed_on) {
      const parts = obs.observed_on.split("-");
      obsDate = new Date(parts[0], parts[1] - 1, parts[2]);
    } else if (obs.created_at) {
      obsDate = new Date(obs.created_at);
    }

    if (cutoff && obsDate && obsDate < cutoff) return;

    const lat = obs.geojson?.coordinates?.[1];
    const lng = obs.geojson?.coordinates?.[0];
    if (lat == null || lng == null) return;

    // Map marker
    const marker = L.marker([lat, lng]);
    marker.bindPopup(`
      <strong>${escapeHtml(obs.species_guess || 'Unknown species')}</strong><br>
      Observed: ${escapeHtml(obs.observed_on || 'n/a')}<br>
      <a href="${detailUrl(obs.id)}">View Details</a><br>
      <a href="https://www.inaturalist.org/observations/${obs.id}" target="_blank" rel="noopener noreferrer">
        View on iNat
      </a>
    `);
    markers.addLayer(marker);

    // Observation list. The card element *is* the link, so keyboard focus,
    // open-in-new-tab and the hover URL preview all come for free.
    const card = document.createElement('a');
    card.className = "observation-item";
    card.href = detailUrl(obs.id);
    // Built as DOM rather than an innerHTML template: alt= is an attribute
    // context, and a species_guess of `" onerror="...` would otherwise add an
    // event handler to an <img> that already fires onerror on a bad photo URL.
    const img = document.createElement('img');
    img.src = obs.photos?.[0]?.url?.replace('square', 'small') || '';
    img.alt = obs.species_guess || 'Unknown';
    const label = document.createElement('span');
    label.textContent = `${obs.species_guess || 'Unknown species'} — ${obs.observed_on || 'n/a'}`;
    card.append(img, label);
    listDiv.appendChild(card);

    count++;
    currentObservations.push(obs);
    minimalObs.push({
      id: obs.id,
      species_guess: obs.species_guess || '',
      observed_on: obs.observed_on || '',
      coordinates: [lat, lng]
    });
  });

  const summary = document.createElement('div');
  summary.textContent = `${count} observations shown (${currentRange})`;
  listDiv.prepend(summary);

  // Store only minimal observation data for QR Admin
  localStorage.setItem("erc_observations", JSON.stringify(minimalObs));

  scheduleRefreshMapView();
}

// Update QR Admin link (same minimal storage)
function updateQRAdminLink() {
  const link = document.getElementById('qr-admin-link');
  if (link) {
    link.href = `qr_admin.html?range=${currentRange}`;
  }
  // Save minimal current observations
  const minimalObs = currentObservations.map(obs => ({
    id: obs.id,
    species_guess: obs.species_guess || '',
    observed_on: obs.observed_on || '',
    coordinates: [obs.geojson?.coordinates?.[1], obs.geojson?.coordinates?.[0]]
  }));
  localStorage.setItem("erc_observations", JSON.stringify(minimalObs));
}


// --- Filter button handlers ---
document.querySelectorAll('.controls button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRange = btn.dataset.range;
    renderObservations();
    updateQRAdminLink();
    scheduleRefreshMapView();
  });
});

// --- Settings ---
const SETTINGS_KEY = 'gt_settings';

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Apply the saved default range before the first render, syncing the
// active filter button so the map opens on the preferred range.
function applyDefaultRange() {
  const { defaultRange } = loadSettings();
  if (!defaultRange) return;
  const btn = document.querySelector(`.controls button[data-range="${defaultRange}"]`);
  if (!btn) return;
  document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentRange = defaultRange;
}

let deferredInstallPrompt = null;

function setupSettings() {
  const overlay = document.getElementById('settingsOverlay');
  const openBtn = document.getElementById('settingsBtn');
  const closeBtn = document.getElementById('settingsClose');
  const rangeSelect = document.getElementById('settingDefaultRange');
  const installBtn = document.getElementById('settingsInstall');
  const clearBtn = document.getElementById('settingsClearData');
  if (!overlay || !openBtn) return;

  function openPanel() {
    rangeSelect.value = loadSettings().defaultRange || currentRange;
    overlay.classList.remove('hidden');
  }

  function closePanel() {
    overlay.classList.add('hidden');
    // The overlay never touched the Leaflet instance, but invalidate size
    // as a belt-and-suspenders against any layout shift while it was open.
    scheduleRefreshMapView();
  }

  openBtn.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closePanel();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) closePanel();
  });

  rangeSelect.addEventListener('change', () => {
    const settings = loadSettings();
    settings.defaultRange = rangeSelect.value;
    saveSettings(settings);
  });

  clearBtn.addEventListener('click', () => {
    if (!confirm('Clear your saved notes, trip plan, and cached observations? This cannot be undone.')) return;
    localStorage.removeItem('tripPlan');
    localStorage.removeItem('erc_observations');
    location.reload();
  });

  // PWA install affordance. Chrome/Edge/Android fire beforeinstallprompt,
  // which reveals a one-tap Install button. iOS Safari never fires it and
  // exposes no install API, so show manual Add-to-Home-Screen steps instead.
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  if (isIOS && !isStandalone) {
    document.getElementById('settingsInstallIOS')?.classList.remove('hidden');
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installBtn.classList.remove('hidden');
  });
  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.classList.add('hidden');
  });
}

// --- Start ---
document.addEventListener("DOMContentLoaded", () => {
  setupSettings();
  applyDefaultRange();
  fetchObservations();
  updateQRAdminLink();
});
