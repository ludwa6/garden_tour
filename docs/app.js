// --- Config ---
const API_BASE = "https://api.inaturalist.org/v1/observations";
const PROJECT_ID = "erc-vale-da-lama";
const STORAGE_KEY_DATA = "gt_cached_obs_v1";
const STORAGE_KEY_GAME = "gt_game_v1";

// Replace with your precise garden rectangle (SW, NE)
const GARDEN_BOUNDS = L.latLngBounds(
  [37.1210, -8.6600], // south-west (approximate)
  [37.1300, -8.6400]  // north-east (approximate)
);

// --- Map setup ---
let map = L.map('map', {
  maxBounds: GARDEN_BOUNDS,
  maxBoundsViscosity: 1.0,
  minZoom: 14,
  maxZoom: 19
});
map.fitBounds(GARDEN_BOUNDS);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
}).addTo(map);

let clusterGroup = L.markerClusterGroup();
map.addLayer(clusterGroup);

// --- UI elements ---
const obsContainer = document.getElementById('observations');
const pointsEl = document.getElementById('points');
const badgesEl = document.getElementById('badges');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const resetBtn = document.getElementById('resetBtn');
const closeSettings = document.getElementById('closeSettings');
document.querySelectorAll('.controls button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.controls button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    loadData(btn.dataset.range);
  });
});

settingsBtn.addEventListener('click', () => settingsPanel.classList.toggle('hidden'));
closeSettings.addEventListener('click', () => settingsPanel.classList.add('hidden'));
resetBtn.addEventListener('click', () => {
  if (confirm('Reset your tour progress? This will clear points, badges, and viewed plants.')) {
    localStorage.removeItem(STORAGE_KEY_GAME);
    updateGamificationUI(); // refresh header
    alert('Progress reset. Enjoy a fresh tour!');
  }
});

// --- Gamification state ---
function getGame(){
  const def = { points: 0, badges: {}, viewed: {}, scans: 0, firstVisit: false };
  try{ return Object.assign(def, JSON.parse(localStorage.getItem(STORAGE_KEY_GAME) || "{}")); }
  catch(e){ return def; }
}
function saveGame(game){ localStorage.setItem(STORAGE_KEY_GAME, JSON.stringify(game)); }

function awardPoints(n){ const g = getGame(); g.points += n; saveGame(g); updateGamificationUI(); }

function awardBadge(key){
  const g = getGame();
  if (!g.badges[key]) { g.badges[key] = true; saveGame(g); updateGamificationUI(); }
}

function markViewed(id){
  const g = getGame();
  if (!g.viewed[id]) { g.viewed[id] = true; saveGame(g); }
}

function updateGamificationUI(){
  const g = getGame();
  pointsEl.textContent = `${g.points} pts`;
  const badgeMap = {
    seed: '🌱',
    bud: '🌿',
    flower: '🌸',
    pollinator: '🐝',
    guardian: '🌳'
  };
  badgesEl.innerHTML = '';
  Object.keys(g.badges).forEach(k => {
    if (g.badges[k]) {
      const span = document.createElement('span');
      span.className = 'badge';
      span.textContent = badgeMap[k] || '🏅';
      badgesEl.appendChild(span);
    }
  });
}

// Initialize badges on first visit
(function initVisit(){
  const g = getGame();
  if (!g.firstVisit) {
    g.firstVisit = true;
    g.badges.seed = true; // 🌱 first visit
    g.points += 1;
    saveGame(g);
  }
  updateGamificationUI();
})();

// --- Data helpers ---
function fmtDate(d){ try { return new Date(d).toLocaleDateString(); } catch(e){ return d; } }
function buildUrl(range){
  let dateParam = "";
  const today = new Date();
  if (range === "today") {
    dateParam = `&d1=${today.toISOString().split('T')[0]}`;
  } else if (range === "week") {
    const weekAgo = new Date(); weekAgo.setDate(today.getDate() - 7);
    dateParam = `&d1=${weekAgo.toISOString().split('T')[0]}`;
  }
  return `${API_BASE}?project_id=${PROJECT_ID}${dateParam}&per_page=200&order=desc&order_by=created_at`;
}

async function fetchObservations(range){
  const url = buildUrl(range);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Network error');
  const json = await res.json();
  const results = json.results.map(obs => ({
    id: obs.id,
    species: obs.species_guess || (obs.taxon ? obs.taxon.name : 'Unknown species'),
    user: obs.user?.login || 'unknown',
    date: obs.observed_on || obs.time_observed_at || obs.created_at,
    link: obs.uri,
    photo: (obs.photos && obs.photos[0]) ? obs.photos[0].url.replace('square','medium') : null,
    coords: obs.geojson?.coordinates || null
  }));
  localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(results));
  return results;
}

function renderList(data){
  obsContainer.innerHTML = '';
  data.forEach(d => {
    const div = document.createElement('div');
    div.className = 'obs';
    div.innerHTML = `
      <img src="${d.photo || 'https://via.placeholder.com/80?text=No+Photo'}" alt="${d.species}">
      <div>
        <a href="${d.link}" target="_blank" rel="noopener">${d.species}</a><br>
        by ${d.user} on ${fmtDate(d.date)}
      </div>
    `;
    obsContainer.appendChild(div);
  });
}

function renderMap(data){
  clusterGroup.clearLayers();
  data.forEach(d => {
    if (d.coords) {
      const m = L.marker([d.coords[1], d.coords[0]]).bindPopup(`
        <b>${d.species}</b><br>
        by ${d.user}<br>
        <a href="${d.link}" target="_blank" rel="noopener">Open on iNaturalist</a><br>
        ${d.photo ? `<img src="${d.photo}" width="140" style="margin-top:4px;border-radius:6px;border:1px solid #e2e8f0">` : ''}
      `);
      m.on('popupopen', () => {
        awardPoints(2); // viewing any observation
        markViewed(d.id);
        // Badge thresholds
        const g = getGame();
        const viewedCount = Object.keys(g.viewed).length;
        if (viewedCount >= 5) awardBadge('flower');    // 🌸
        if (viewedCount >= 10) awardBadge('pollinator'); // 🐝
        updateGamificationUI();
      });
      clusterGroup.addLayer(m);
    }
  });
}

// Open popup for specific id (if present) without changing map center/zoom
function openPopupForId(id){
  const layers = clusterGroup.getLayers();
  for (let i=0;i<layers.length;i++){
    const layer = layers[i];
    const content = layer.getPopup()?.getContent() || "";
    if (content.includes(`/observations/${id}`) || content.includes(`?id=${id}`)) {
      // award scan points the first time
      const g = getGame();
      if (!g.viewed[id]) { // treat deep-link as a scan
        awardPoints(10);
        awardBadge('bud'); // 🌿 first scan
        g.scans = (g.scans || 0) + 1;
        saveGame(g);
        updateGamificationUI();
      }
      layer.openPopup();
      return true;
    }
  }
  return false;
}

// Load + render, with network-first then cache fallback
async function loadData(range){
  obsContainer.textContent = 'Loading...';
  try {
    const data = await fetchObservations(range);
    renderMap(data); renderList(data);
    // Pre-cache photos
    if ('caches' in window) {
      const cache = await caches.open('gt-runtime');
      await Promise.all(data.filter(d=>d.photo).map(d => cache.add(d.photo).catch(()=>{})));
    }
    obsContainer.dataset.status = 'ok';
  } catch(e) {
    console.warn('Network failed, using cached dataset', e);
    const cached = localStorage.getItem(STORAGE_KEY_DATA);
    if (cached) {
      const data = JSON.parse(cached);
      renderMap(data); renderList(data);
      obsContainer.dataset.status = 'cached';
    } else {
      obsContainer.innerHTML = '<p>No cached data available offline.</p>';
      obsContainer.dataset.status = 'empty';
    }
  } finally {
    // If deep-link id is present, try opening popup
    const params = new URLSearchParams(location.search);
    const deepId = params.get('id');
    if (deepId) openPopupForId(deepId);
  }
}

// Service worker registration
if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');

// Initial load + refresh every 60s
loadData('today');
setInterval(() => {
  const active = document.querySelector('.controls button.active')?.dataset.range || 'today';
  loadData(active);
}, 60000);
