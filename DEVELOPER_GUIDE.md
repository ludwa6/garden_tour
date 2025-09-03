# 🔧 Garden Tour App - Developer Guide

## Project Architecture

The Garden Tour application is a **static Progressive Web App (PWA)** built with vanilla JavaScript, designed for deployment on GitHub Pages. It integrates real-time botanical data from iNaturalist with local user interaction features.

## 🏗️ Technical Stack

### Core Technologies
- **Frontend**: Vanilla JavaScript ES6+, HTML5, CSS3
- **Mapping**: Leaflet.js with clustering and KML support
- **PWA Features**: Service Worker, Web App Manifest
- **QR Generation**: QRious library
- **Data Source**: iNaturalist API v1
- **Deployment**: GitHub Pages (static hosting)

### Key Dependencies
```html
<!-- Core mapping and visualization -->
<script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster/dist/leaflet.markercluster.js"></script>
<script src="https://unpkg.com/leaflet-omnivore@0.3.4/leaflet-omnivore.min.js"></script>

<!-- QR code generation -->
<script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
```

## 📁 Project Structure

```
├── index.html              # Main application entry point
├── app.js                  # Core application logic
├── style.css               # Global styles and responsive design
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline functionality
├── poi/
│   └── detail.html         # Species detail pages
├── qr_admin.html          # QR code generation interface
├── qr_admin.js            # QR administration logic
├── tripplan.html          # User trip planning interface
├── userjournals.html      # Personal journaling interface
├── admin.html             # Administrative dashboard
├── footer.html            # Shared navigation component
├── icons/                 # PWA icons
└── docs/                  # Project documentation
```

## 🔄 Data Flow Architecture

### 1. Data Sources
```javascript
// Primary API endpoint
const INAT_API = "https://api.inaturalist.org/v1/observations";
const PROJECT_ID = 197410; // Quinta Vale da Lama project

// Local storage keys
const STORAGE_KEYS = {
  observations: "erc_observations",
  tripPlan: "tripPlan",
  registry: "filteredRegistry"
};
```

### 2. State Management
The application uses **localStorage** for client-side state persistence:

- **`erc_observations`**: Minimal observation data for QR admin
- **`tripPlan`**: User's saved observations with notes and photos
- **`filteredRegistry`**: Admin-curated POI registry

### 3. API Integration
```javascript
// Fetch observations with error handling
async function fetchObservations() {
  const url = `${INAT_API}?project_id=${PROJECT_ID}&order=desc&order_by=observed_on&per_page=200&quality_grade=any`;
  
  try {
    const res = await fetch(url);
    const json = await res.json();
    allObservations = json.results || [];
    renderObservations();
  } catch (error) {
    // Graceful degradation for offline scenarios
    handleOfflineMode();
  }
}
```

## 🌍 Cross-Environment Compatibility

### Dynamic Base Path Resolution
The app automatically detects its hosting environment:

```javascript
// Handles both localhost development and GitHub Pages deployment
const repoRoot = window.location.pathname.split("/")[1];
window.basePath = (repoRoot && window.location.hostname.includes("github.io")) 
  ? `/${repoRoot}/` 
  : "/";
```

### Asset URL Generation
```javascript
function makeAssetUrl(relativePath) {
  return new URL(relativePath, window.location.origin + window.basePath).href;
}
```

## 🗺️ Mapping Implementation

### Leaflet Configuration
```javascript
// Initialize map with proper bounds
const map = L.map('map').setView([37.1, -8.6], 14);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Load garden perimeter from KML
omnivore.kml(makeAssetUrl('Q.VdL-Perimeter.kml'))
  .on('ready', function (e) {
    map.fitBounds(e.target.getBounds());
  })
  .addTo(map);
```

### Marker Clustering
```javascript
// Efficient marker management for large datasets
const markers = L.markerClusterGroup();
markers.addLayer(L.marker([lat, lng]).bindPopup(popupContent));
map.addLayer(markers);
```

## 📱 Progressive Web App Features

### Service Worker Strategy
```javascript
// Cache-first strategy for app shell
const APP_SHELL = ["/", "/index.html", "/style.css", "/poi/detail.html"];

// Network-first with cache fallback for API calls
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return resp || fetch(event.request);
    })
  );
});
```

### Offline Data Persistence
```javascript
// Store base64 images for offline viewing
async function saveOfflineData(observation) {
  const cache = await caches.open("fieldguide-offline-v1");
  const base64Image = await convertToBase64(observation.imageUrl);
  
  // Store in both cache and localStorage
  await cache.add(observation.apiUrl);
  localStorage.setItem(`inat:${observation.id}`, JSON.stringify({
    ...observation,
    imageData: base64Image
  }));
}
```

## 🎮 Interactive Features

### Real-time Filtering
```javascript
// Time-based observation filtering
function filterObservations(range) {
  const now = new Date();
  let cutoff = null;
  
  switch(range) {
    case 'today':
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
      break;
  }
  
  return allObservations.filter(obs => {
    const obsDate = new Date(obs.observed_on || obs.created_at);
    return !cutoff || obsDate >= cutoff;
  });
}
```

### User Note Management
```javascript
// Save user observations with rich metadata
function saveUserNote(obsId, noteText, photoFile, shareWithGarden) {
  const entry = {
    poi_id: String(obsId),
    species_name: getCurrentSpeciesName(),
    note: noteText,
    photo: photoFile ? await fileToBase64(photoFile) : null,
    date_saved: new Date().toISOString(),
    shared: shareWithGarden
  };
  
  const existing = JSON.parse(localStorage.getItem("tripPlan") || "[]");
  existing.push(entry);
  localStorage.setItem("tripPlan", JSON.stringify(existing));
}
```

## 🔐 Security Considerations

### Content Security Policy
```html
<!-- Recommended CSP headers for deployment -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
               style-src 'self' 'unsafe-inline' https://unpkg.com;
               img-src 'self' data: https: http:;
               connect-src 'self' https://api.inaturalist.org https://script.google.com;">
```

### API Key Management
```javascript
// No sensitive API keys required - uses public iNaturalist API
// Google Apps Script integration uses public endpoint
const WEB_APP_URL = "https://script.google.com/macros/s/.../exec";
```

## 🚀 Deployment Pipeline

### GitHub Pages Configuration
1. **Repository Settings**: Enable GitHub Pages from main branch
2. **Base URL**: Automatically handled by dynamic path resolution
3. **Asset Paths**: Use relative paths throughout codebase
4. **Service Worker**: Scope limited to repository path

### Build Process
No build step required - pure static deployment:
```bash
# Simple deployment process
git add .
git commit -m "Update garden tour app"
git push origin main
# GitHub Pages automatically deploys
```

### Environment Variables
```javascript
// Environment detection for development vs production
const isDevelopment = location.hostname === "127.0.0.1" || location.hostname === "localhost";
const apiEndpoint = isDevelopment ? 
  "http://localhost:3000/api" : 
  "https://api.inaturalist.org/v1";
```

## 🔧 Development Setup

### Local Development
```bash
# Start simple HTTP server
python -m http.server 5000
# or
npx serve -s . -p 5000

# Access at http://localhost:5000
```

### Testing Checklist
- [ ] **Map loads** with correct garden boundaries
- [ ] **Observations render** from iNaturalist API
- [ ] **Offline mode** works after initial load
- [ ] **QR codes generate** correctly for all observations
- [ ] **Notes save/load** from localStorage
- [ ] **Export functions** produce valid files
- [ ] **Responsive design** works on mobile devices

## 📊 Performance Optimization

### API Request Optimization
```javascript
// Limit API requests and cache responses
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const lastFetch = localStorage.getItem('lastApiUpdate');

if (!lastFetch || Date.now() - parseInt(lastFetch) > CACHE_DURATION) {
  await fetchObservations();
  localStorage.setItem('lastApiUpdate', Date.now().toString());
}
```

### Image Optimization
```javascript
// Progressive image loading with fallbacks
function loadOptimizedImage(originalUrl) {
  // Replace square/medium with large for better quality
  return originalUrl
    .replace('square.', 'large.')
    .replace('medium.', 'large.');
}
```

### Memory Management
```javascript
// Clean up event listeners and observers
function cleanup() {
  markers.clearLayers();
  if (resizeObserver) resizeObserver.disconnect();
  if (mutationObserver) mutationObserver.disconnect();
}
```

## 🐛 Error Handling

### Network Resilience
```javascript
// Graceful degradation for network issues
async function robustApiCall(url, fallbackData) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('API call failed, using fallback:', error);
    return fallbackData || getFromCache(url);
  }
}
```

### User Feedback
```javascript
// Inform users about app state
function updateStatus(message, type = 'info') {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
  
  if (type === 'error') {
    // Provide actionable guidance
    statusEl.innerHTML += '<br><small>Check connection and try again</small>';
  }
}
```

## 🔮 Extension Points

### Adding New Features
1. **New observation sources**: Extend API integration
2. **Additional map layers**: Integrate with Leaflet plugins
3. **Enhanced exports**: Add PDF/KML export options
4. **User authentication**: Integrate with iNaturalist OAuth
5. **Real-time updates**: Add WebSocket connections

### Plugin Architecture
```javascript
// Extensible plugin system
const GardenTourPlugins = {
  register(name, plugin) {
    this[name] = plugin;
    plugin.init && plugin.init();
  },
  
  // Example: Weather integration plugin
  weather: {
    init() { /* Setup weather display */ },
    update() { /* Fetch current conditions */ }
  }
};
```

This architecture supports both current functionality and future enhancements while maintaining simplicity and performance.