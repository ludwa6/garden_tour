
// qr_admin.js
document.addEventListener('DOMContentLoaded', function() {
  const observationSelect = document.getElementById('observationSelect');
  const qrCanvas = document.getElementById('qrCanvas');
  const observationPreview = document.getElementById('observationPreview');

  // Load observations from localStorage (set by app.js)
  function loadObservations() {
    const stored = localStorage.getItem('erc_observations');
    const observations = stored ? JSON.parse(stored) : [];
    
    if (observations.length === 0) {
      observationSelect.innerHTML = '<option value="">No observations available</option>';
      return;
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

    // Generate QR code pointing to POI detail page
    const detailUrl = `${window.location.origin}poi/detail.html?obs=${obsId}`;
    
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
