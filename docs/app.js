let map = L.map('map').setView([37.134, -8.606], 16);
let markers = L.markerClusterGroup();
let observations = [];

// Base map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Load polygon from KML
fetch('Q.VdL-Perimeter.kml')
    .then(res => res.text())
    .then(kmlText => {
        const parser = new DOMParser();
        const kml = parser.parseFromString(kmlText, 'text/xml');
        const track = new L.KML(kml);
        map.addLayer(track);
        map.fitBounds(track.getBounds());
    });

// Load observations from iNaturalist
fetch('https://api.inaturalist.org/v1/observations?project_id=erc-vale-da-lama&per_page=200')
    .then(res => res.json())
    .then(data => {
        observations = data.results;
        observations.forEach(obs => {
            markers.addLayer(createMarker(obs));
        });
        map.addLayer(markers);
        document.getElementById('observations').textContent = `${observations.length} observations loaded`;
    });

// Create marker for an observation
function createMarker(obs) {
    const lat = obs.geojson.coordinates[1];
    const lng = obs.geojson.coordinates[0];
    return L.marker([lat, lng]).bindPopup(`
        <strong>${obs.species_guess || 'Unknown species'}</strong><br>
        Observed on: ${obs.observed_on}<br>
        <a href="${obs.uri}" target="_blank">View on iNaturalist</a>
    `);
}

// Filter buttons
document.querySelectorAll('[data-range]').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('[data-range]').forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        const range = button.getAttribute('data-range');
        filterObservations(range);
    });
});

function filterObservations(range) {
    let cutoffDate;
    const now = new Date();

    if (range === 'today') {
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === 'week') {
        cutoffDate = new Date(now);
        cutoffDate.setDate(now.getDate() - 7);
    } else {
        cutoffDate = null; // 'all' means no filter
    }

    markers.clearLayers();
    observations.forEach(obs => {
        const obsDate = new Date(obs.observed_on);
        if (!cutoffDate || obsDate >= cutoffDate) {
            markers.addLayer(createMarker(obs));
        }
    });

    document.getElementById('observations').textContent =
        `${markers.getLayers().length} observations shown`;
}
