// app.js

// --- Map setup ---
const map = L.map('map', { scrollWheelZoom: false });
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Vale da Lama polygon (inlined from your KML, Leaflet [lat, lng])
const valeDaLamaCoords = [
  [37.13924265139369, -8.636271847257497],
  [37.14086023764482, -8.635269398509895],
  [37.14144605960031, -8.635877138091065],
  [37.14123571107703, -8.63351206678051],
  [37.14095257049191, -8.633209839587328],
  [37.14172254184141, -8.629377242951762],
  [37.14261830051814, -8.629864942912429],
  [37.14458273318047, -8.627471631952385],
  [37.14623518069011, -8.628750482809236],
  [37.14530688164007, -8.626737950593748],
  [37.14553633367225, -8.625694678399823],
  [37.14236038350018, -8.623646841721781],
  [37.14157444769558, -8.624383073647007],
  [37.14063036758847, -8.62491747613085],
  [37.14064868092568, -8.625473425030657],
  [37.14010298450564, -8.626020893255692],
  [37.1398366431013, -8.62564351434529],
  [37.13947473942091, -8.626963150246794],
  [37.13976179830679, -8.627775745822682],
  [37.13908310908406, -8.630340385274378],
  [37.13785769840761, -8.636876973793695],
  [37.13875636864039, -8.635865251824153],
  [37.13924265139369, -8.636271847257497]
];

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
