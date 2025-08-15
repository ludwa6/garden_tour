// =======================
// Vale da Lama PWA - app.js
// =======================

const polygonCoords = [
  [-8.632167, 37.137633],
  [-8.626278, 37.138647],
  [-8.624861, 37.136075],
  [-8.623086, 37.133928],
  [-8.623806, 37.132386],
  [-8.628083, 37.131000],
  [-8.631306, 37.131861],
  [-8.633556, 37.133056],
  [-8.634639, 37.135361],
  [-8.632167, 37.137633]
];

const projectSlug = "erc-vale-da-lama";
const iNatProjectURL = `https://api.inaturalist.org/v1/observations?project_slug=${projectSlug}&per_page=200`;

// Initialize map
const map = L.map("map", { zoomControl: false });
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const polygon = L.polygon(polygonCoords.map(c => [c[1], c[0]]), { 
  color: "green", 
  weight: 2 
});
polygon.addTo(map);

// Start by fitting to polygon bounds
map.fitBounds(polygon.getBounds());

// Marker cluster
const markers = L.markerClusterGroup();
map.addLayer(markers);

// Render observations
function renderObservations(data) {
  if (!data?.results) {
    console.warn("No results in observation data.");
    return;
  }

  const bounds = L.latLngBounds([]);

  data.results.forEach(obs => {
    if (obs.geojson?.coordinates) {
      const [lon, lat] = obs.geojson.coordinates;
      const marker = L.marker([lat, lon]);
      marker.bindPopup(`
        <b>${obs.species_guess || "Unknown species"}</b><br>
        Observed on: ${obs.observed_on || "N/A"}<br>
        <a href="${obs.uri}" target="_blank">View on iNaturalist</a><br>
        ${obs.photos?.[0]?.url 
          ? `<img src="${obs.photos[0].url.replace("square", "medium")}" width="150">` 
          : ""}
      `);
      markers.addLayer(marker);
      bounds.extend([lat, lon]);
    }
  });

  // Zoom logic with fallback
  if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.2)); // zoom to observation points
  } else {
    map.fitBounds(polygon.getBounds()); // fallback to polygon
  }
}

// Load from cache or network
function loadObservations() {
  return caches.match(iNatProjectURL)
    .then(cached => cached ? cached.json() : fetch(iNatProjectURL).then(r => r.json()))
    .then(renderObservations)
    .catch(err => {
      console.error("Error loading observations:", err);
      // If error, ensure polygon is still visible
      map.fitBounds(polygon.getBounds());
    });
}

// Listen for SW preload message
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js")
    .then(reg => console.log("Service Worker registered", reg))
    .catch(err => console.error("SW registration failed:", err));

  navigator.serviceWorker.addEventListener("message", event => {
    if (event.data?.type === "INIT_OBSERVATIONS") {
      console.log("Got observations from SW immediately");
      renderObservations(event.data.payload);
    }
  });
}

// First-time load fallback
loadObservations();
