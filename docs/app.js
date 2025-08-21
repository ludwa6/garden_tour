// app.js
/* global L, omnivore */

// --- Setup Map ---
const map = L.map('map').setView([37.1, -8.6], 14);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// --- Load Vale da Lama perimeter from KML ---
omnivore.kml('Q.VdL-Perimeter.kml')
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
    // Fallback (Vale da Lama)
    map.setView([37.146, -8.642], 14);
  }
}

function scheduleRefreshMapView() {
  // Debounce into the next layout frame(s)
  requestAnimationFrame(() => {
    requestAnimationFrame(refreshMapView);
  });
}

// Observe map element size changes (modern browsers)
(function setupObservers() {
  const mapEl = document.getElementById('map');
  if (mapEl && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(() => scheduleRefreshMapView());
    ro.observe(mapEl);
  }
  window.addEventListener('resize', scheduleRefreshMapView);

  // If the observation list changes (e.g., filter), refresh map after DOM updates
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

/// --- Render observations based on filter ---
function renderObservations() {
  markers.clearLayers();
  const listDiv = document.getElementById('observations');
  if (!listDiv) return;
  listDiv.innerHTML = ""; // clear before re-render

  const now = new Date();
  let cutoff = null;

  if (currentRange === 'today') {
    cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (currentRange === 'week') {
    cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    cutoff.setDate(cutoff.getDate() - 7);
  } else {
    cutoff = null; // 'all' shows everything
  }

  let count = 0;
  currentObservations = [];
  allObservations.forEach(obs => {
    // --- Normalize observed date to midnight local time ---
    let obsDate = null;
    if (obs.observed_on) {
      const parts = obs.observed_on.split("-"); // "YYYY-MM-DD"
      obsDate = new Date(parts[0], parts[1] - 1, parts[2]); // local midnight
    } else if (obs.created_at) {
      obsDate = new Date(obs.created_at);
    }

    if (cutoff && obsDate && obsDate < cutoff) return;

    const lat = obs.geojson?.coordinates?.[1];
    const lng = obs.geojson?.coordinates?.[0];
    if (lat == null || lng == null) return; // allow 0, just not null/undefined

    // --- Add map marker ---
    const marker = L.marker([lat, lng]);
    marker.bindPopup(`
      <strong>${obs.species_guess || 'Unknown species'}</strong><br>
      Observed: ${obs.observed_on || 'n/a'}<br>
      <a href="https://www.inaturalist.org/observations/${obs.id}" target="_blank">
        View on iNat
      </a>
    `);
    markers.addLayer(marker);

    // --- Add entry below map ---
    const div = document.createElement('div');
    div.className = "observation-item";
    div.innerHTML = `
      <img src="${obs.photos?.[0]?.url?.replace('square', 'small') || ''}" 
           alt="${obs.species_guess || 'Unknown'}" />
      <span>${obs.species_guess || 'Unknown species'} — ${obs.observed_on || 'n/a'}</span>
    `;
    listDiv.appendChild(div);

    count++;
    currentObservations.push(obs);
  });

  // --- Summary at top ---
  const summary = document.createElement('div');
  summary.textContent = `${count} observations shown (${currentRange})`;
  listDiv.prepend(summary);

  // --- Persist for QR Admin ---
  localStorage.setItem("erc_observations", JSON.stringify(currentObservations));

  // --- Reflow-safe map update (works for Today / Week / All) ---
  scheduleRefreshMapView();
}

// --- Update QR Admin link with current filter ---
function updateQRAdminLink() {
  const link = document.getElementById('qr-admin-link');
  if (link) {
    link.href = `qr_admin.html?range=${currentRange}`;
  }
  localStorage.setItem("erc_observations", JSON.stringify(currentObservations));
}

// Call it whenever filter changes or page loads
document.addEventListener("DOMContentLoaded", updateQRAdminLink);

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

// --- Start ---
fetchObservations();
