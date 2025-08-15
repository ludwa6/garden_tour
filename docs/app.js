// app.js

const map = L.map('map', {
    scrollWheelZoom: false
});

// Vale da Lama polygon from your KML
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

const polygon = L.polygon(valeDaLamaCoords, { color: 'green' }).addTo(map);
map.fitBounds(polygon.getBounds());

// Base map layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const projectSlug = "erc-vale-da-lama";

// Load observations with optional date filter
async function loadObservations(days) {
    let url = `https://api.inaturalist.org/v1/observations?project_slug=${projectSlug}&order_by=observed_on&order=desc&per_page=200`;
    
    if (days) {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);
        const formattedDate = sinceDate.toISOString().split('T')[0];
        url += `&d1=${formattedDate}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    // Clear existing markers
    if (window.obsLayer) {
        map.removeLayer(window.obsLayer);
    }

    const markers = data.results.map(obs => {
        const lat = obs.geojson.coordinates[1];
        const lon = obs.geojson.coordinates[0];
        return L.marker([lat, lon]).bindPopup(`
            <b>${obs.species_guess || 'Unknown species'}</b><br>
            Observed on: ${obs.observed_on}<br>
            <a href="${obs.uri}" target="_blank">View on iNaturalist</a>
        `);
    });

    window.obsLayer = L.layerGroup(markers).addTo(map);
}

// Hook up filter buttons
document.querySelectorAll("[data-days]").forEach(btn => {
    btn.addEventListener("click", () => {
        const days = parseInt(btn.getAttribute("data-days"));
        loadObservations(days);
    });
});

// Initial load
loadObservations();
