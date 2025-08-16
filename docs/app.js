// app.js

// --- Map setup ---
const map = L.map('map', { scrollWheelZoom: false });
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// load Vale da Lama perimeter from KML
omnivore.kml('Q.VdL-Perimeter.kml')
  .on('ready', function(e) {
    map.fitBounds(e.target.getBounds());
  })
  .addTo(map);

const polygon = L.polygon(valeDaLamaCoords, { color: 'green', weight: 2, fillOpacity: 0.25 }).addTo(map);
map.fitBounds(polygon.getBounds());

// --- Marker cluster & state ---
const cluster = L.markerClusterGroup();
map.addLayer(cluster);

const statusEl = document.getElementById('observations');
const projectSlug = 'erc-vale-da-lama';

let allObservations = [];

// --- Fetch all observations once (quality_grade=any so “today” casual obs show) ---
async function fetchAllObservations() {
  const url = `https://api.inaturalist.org/v1/observations?project_slug=${encodeURIComponent(projectSlug)}&order=desc&order_by=observed_on&per_page=200&quality_grade=any&_=${Date.now()}`;
  console.log('[iNat] URL:', url);

  try {
    const res = await fetch(url, { cache: 'no-store' });
    console.log('[iNat] Status:', res.status, res.statusText);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    allObservations = Array.isArray(data?.results) ? data.results : [];
    console.log('[iNat] Loaded results:', allObservations.length);

    // Initial render = “all”
    renderFiltered('all');
  } catch (e) {
    console.error('[iNat] Fetch failed:', e);
    statusEl.textContent = 'Failed to load observations.';
  }
}

// --- Render based on range ---
function renderFiltered(range) {
  cluster.clearLayers();

  const now = new Date();
  let cutoff = null;

  if (range === 'today') {
    cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === 'week') {
    cutoff = new Date(now);
    cutoff.setDate(now.getDate() - 7);
  } // else 'all' -> no cutoff

  let shown = 0;

  for (const obs of allObservations) {
    const coords = obs?.geojson?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;

    const [lon, lat] = coords;

    // Favor observed_on; fall back to created_at if needed
    const obsDate = obs?.observed_on
      ? new Date(obs.observed_on)
      : (obs?.created_at ? new Date(obs.created_at) : null);

    if (cutoff && obsDate && obsDate < cutoff) continue;

    const marker = L.marker([lat, lon]).bindPopup(`
      <strong>${obs.species_guess || 'Unknown species'}</strong><br>
      Observed on: ${obs.observed_on || '—'}<br>
      <a href="${obs.uri}" target="_blank" rel="noopener">View on iNaturalist</a>
    `);

    cluster.addLayer(marker);
    shown++;
  }

  statusEl.textContent = `${shown} observations shown`;
}

// --- Wire the existing header buttons using data-range ---
document.querySelectorAll('[data-range]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-range]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const range = btn.getAttribute('data-range'); // 'today' | 'week' | 'all'
    renderFiltered(range);
  });
});

// --- Go! ---
fetchAllObservations();
