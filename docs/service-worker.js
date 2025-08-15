// Initialize map
const map = L.map('map').setView([37.1365, -8.604], 15); // Initial temporary center

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Vale da Lama polygon (parsed from Q.VdL-Perimeter.kml)
const vdlPolygonCoords = [
  [37.140057, -8.611721],
  [37.140065, -8.599153],
  [37.132352, -8.599208],
  [37.132295, -8.611767],
  [37.140057, -8.611721]
];

const vdlPolygon = L.polygon(vdlPolygonCoords, {
  color: '#006400',      // Dark green border
  weight: 2,
  fillColor: '#90EE90',  // Light green fill
  fillOpacity: 0.3
}).addTo(map);

// Fit to polygon bounds once on load
map.fitBounds(vdlPolygon.getBounds());

// Fetch observations
const projectSlug = 'erc-vale-da-lama';
const observationsUrl = `https://api.inaturalist.org/v1/observations?project_slug=${projectSlug}&per_page=200&order=desc&order_by=created_at`;

let markersLayer = L.layerGroup().addTo(map);

function fetchObservations(dateRange = '') {
  let url = observationsUrl;
  if (dateRange) {
    const today = new Date();
    let afterDate = new Date();
    if (dateRange === 'week') {
      afterDate.setDate(today.getDate() - 7);
    } else if (dateRange === 'month') {
      afterDate.setMonth(today.getMonth() - 1);
    } else if (dateRange === 'year') {
      afterDate.setFullYear(today.getFullYear() - 1);
    }
    url += `&d1=${afterDate.toISOString().split('T')[0]}`;
  }

  fetch(url)
    .then(response => response.json())
    .then(data => {
      markersLayer.clearLayers();
      data.results.forEach(obs => {
        if (obs.geojson && obs.geojson.coordinates) {
          const coords = [obs.geojson.coordinates[1], obs.geojson.coordinates[0]];
          const marker = L.marker(coords)
            .bindPopup(`
              <b>${obs.species_guess || 'Unknown species'}</b><br>
              Observed: ${new Date(obs.observed_on).toLocaleDateString()}<br>
              <a href="${obs.uri}" target="_blank">View on iNaturalist</a>
            `);
          markersLayer.addLayer(marker);
        }
      });
    })
    .catch(err => console.error('Error fetching observations:', err));
}

// Initial fetch
fetchObservations();

// Event listeners for date filter buttons
document.getElementById('all-time').addEventListener('click', () => fetchObservations());
document.getElementById('last-week').addEventListener('click', () => fetchObservations('week'));
document.getElementById('last-month').addEventListener('click', () => fetchObservations('month'));
document.getElementById('last-year').addEventListener('click', () => fetchObservations('year'));
