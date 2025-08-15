// app.js

// --- Map init (unchanged behavior) ---
const map = L.map('map', { scrollWheelZoom: false });

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

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// --- iNaturalist fetching with robust logging ---
const projectSlug = 'erc-vale-da-lama';
const loadingEl = document.getElementById('loading');

// Reusable layer to hold markers
let obsLayer = L.layerGroup().addTo(map);

function buildObservationsUrl(days) {
  // Base URL: include all quality grades so "today" casual obs show up
  let url = `https://api.inaturalist.org/v1/observations?project_slug=${encodeURIComponent(projectSlug)}&order_by=observed_on&order=desc&per_page=200&quality_grade=any`;

  if (days) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const d1 = sinceDate.toISOString().split('T')[0];
    url += `&d1=${d1}`;
  }
  // Cache-buster to avoid stale SW/HTTP caches
  url += `&_=${Date.now()}`;
  return url;
}

async function loadObservations(days) {
  const url = buildObservationsUrl(days);
  loadingEl && (loadingEl.style.display = 'block');

  // Debug logging
  console.log('%c[iNat] Request URL:', 'color:#2b90d9;font-weight:bold;', url);

  try {
    const res = await fetch(url, { cache: 'no-store' });
    console.log('%c[iNat] HTTP status:', 'color:#2b90d9;', res.status, res.statusText);

    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const data = await res.json();

    // Debug result info
    const count = Array.isArray(data?.results) ? data.results.length : 0;
    const sampleIds = data?.results?.slice(0, 3).map(r => r.id);
    console.log('%c[iNat] Results:', 'color:#2b90d9;', { count, sampleIds });

    // Clear and redraw markers
    obsLayer.clearLayers();

    if (count === 0) {
      console.warn('[iNat] No observations returned for this filter.', { days });
    } else {
      const markers = [];
      for (const obs of data.results) {
        const coords = obs?.geojson?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) continue;

        const [lon, lat] = coords;
        const m = L.marker([lat, lon]).bindPopup(`
          <b>${obs.species_guess || 'Unknown species'}</b><br>
          Observed on: ${obs.observed_on || '—'}<br>
          <a href="${obs.uri}" target="_blank" rel="noopener">View on iNaturalist</a>
        `);
        markers.push(m);
      }
      if (markers.length) {
        L.layerGroup(markers).addTo(obsLayer);
      } else {
        console.warn('[iNat] Observations returned but none had valid coordinates.');
      }
    }
  } catch (err) {
    console.error('[iNat] Fetch failed:', err);
  } finally {
    loadingEl && (loadingEl.style.display = 'none');
  }
}

// Hook up filter buttons (they should have data-days attrs in your HTML)
document.querySelectorAll('[data-days]').forEach(btn => {
  btn.addEventListener('click', () => {
    const days = parseInt(btn.getAttribute('data-days'), 10);
    loadObservations(Number.isFinite(days) ? days : undefined);
  });
});

// Initial load (no filter = all time)
loadObservations();
