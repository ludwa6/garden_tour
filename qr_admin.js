document.addEventListener('DOMContentLoaded', function() {
  const observationSelect = document.getElementById('observationSelect');
  const qrCanvas = document.getElementById('qrCanvas');
  const observationPreview = document.getElementById('observationPreview');

  // Use basePath computed in qr_admin.html, or compute fallback
  const basePath = window.basePath || (
    window.location.hostname.includes("github.io")
      ? `/${window.location.pathname.split("/")[1]}/`
      : "/"
  );

  // Load observations from localStorage (set by app.js)
  function loadObservations() {
    const stored = localStorage.getItem('erc_observations');
    const observations = stored ? JSON.parse(stored) : [];
    
    console.log('Loaded observations:', observations.length, 'items');
    
    if (observations.length === 0) {
      observationSelect.innerHTML = '<option value="">No observations available - visit main page first</option>';
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

    const obs = observations.find(o => o.id == obsId);
    if (!obs) return;

    // Generate detail URL safely
    const detailUrl = new URL(`poi/detail.html?obs=${obsId}`, window.location.origin + basePath).href;

    if (typeof QRCode !== 'undefined') {
      QRCode.toCanvas(qrCanvas, detailUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, function(error) {
        if (error) console.error('QR generation error:', error);
      });
      qrCanvas.style.display = 'block';
    }

    // Show observation preview
    observationPreview.innerHTML = `
      <h4>Preview:</h4>
      <p><strong>Species:</strong> ${obs.species_guess || 'Unknown'}</p>
      <p><strong>Observed:</strong> ${obs.observed_on || 'n/a'}</p>
      <p><strong>Detail URL:</strong> <a href="${detailUrl}" target="_blank">${detailUrl}</a></p>
      ${obs.photos && obs.photos[0] ? `<img src="${obs.photos[0].url}" style="max-width: 200px; border-radius: 4px;">` : ''}
    `;
  }

  // Initialize
  const observations = loadObservations();
  
  // Handle dropdown changes
  observationSelect.addEventListener('change', function() {
    generateQRAndPreview(this.value, observations);
  });

  console.log('QR Admin loaded with', observations?.length || 0, 'observations');
});
