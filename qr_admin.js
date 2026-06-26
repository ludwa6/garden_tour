document.addEventListener('DOMContentLoaded', function() {
  const observationSelect = document.getElementById('observationSelect');
  const qrCanvas = document.getElementById('qrCanvas');
  const observationPreview = document.getElementById('observationPreview');


  function safeParse(json, fallback) {
    try { return JSON.parse(json); } catch { return fallback; }
  }

  // Load observations from localStorage (set by index/app.js)
  function loadObservations() {
    const stored = localStorage.getItem('erc_observations');
    const observations = stored ? safeParse(stored, []) : [];

    console.log('[QR Admin] Loaded observations:', observations.length);

    if (!observations.length) {
      observationSelect.innerHTML =
        '<option value="">No observations available — open index.html first to load data</option>';
      return [];
    }

    // Populate dropdown
    observationSelect.innerHTML = '<option value="">Select an observation...</option>';
    observations.forEach(obs => {
      const option = document.createElement('option');
      option.value = obs.id;
      option.textContent = `${obs.species_guess || 'Unknown'} (ID: ${obs.id})`;
      observationSelect.appendChild(option);
    });

    return observations;
  }

  // Generate QR code and preview
  function generateQRAndPreview(obsId, observations) {
    if (!obsId) {
      qrCanvas.style.display = 'none';
      observationPreview.innerHTML = '';
      return;
    }

    const obs = observations.find(o => String(o.id) === String(obsId));
    if (!obs) return;

    // Build the detail URL relative to the repo base (works from any page)
    const detailUrl = new URL(`poi/detail.html?obs=${encodeURIComponent(obsId)}`,
                              window.location.origin + window.appBase).href;

    if (typeof QRCode !== 'undefined') {
      QRCode.toCanvas(qrCanvas, detailUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      }, function(error) {
        if (error) console.error('QR generation error:', error);
      });
      qrCanvas.style.display = 'block';
    }

    // Show observation preview
    const photoUrl = (obs.photos && obs.photos[0] && obs.photos[0].url) ? obs.photos[0].url : null;
    observationPreview.innerHTML = `
      <h4>Preview:</h4>
      <p><strong>Species:</strong> ${obs.species_guess || 'Unknown'}</p>
      <p><strong>Observed:</strong> ${obs.observed_on || 'n/a'}</p>
      <p><strong>Detail URL:</strong> <a href="${detailUrl}" target="_blank" rel="noopener">${detailUrl}</a></p>
      ${photoUrl ? `<img src="${photoUrl}" style="max-width: 220px; border-radius: 4px;">` : ''}
    `;
  }

  // Initialize
  const observations = loadObservations();

  // Handle dropdown changes
  observationSelect.addEventListener('change', function() {
    generateQRAndPreview(this.value, observations);
  });

  console.log('[QR Admin] Ready with', observations.length, 'observations');
});
