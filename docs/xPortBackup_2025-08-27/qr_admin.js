document.addEventListener("DOMContentLoaded", () => {
  // --- Load stored observations ---
  const stored = localStorage.getItem("erc_observations");
  let observations = [];
  try {
    observations = stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse stored observations", e);
  }

  const selectEl = document.getElementById("observationSelect");
  const qrCanvas = document.getElementById("qrCanvas");
  const previewDiv = document.getElementById("observationPreview");
  const downloadBtn = document.getElementById("downloadQR");
  const exportBtn = document.getElementById("exportRegistry");

  // --- Local registry of generated QR codes ---
  let registry = [];

  // --- Populate dropdown ---
  if (observations.length > 0) {
    selectEl.innerHTML = "";
    observations.forEach(obs => {
      const opt = document.createElement("option");
      opt.value = obs.id;
      opt.textContent = `${obs.species_guess || "Unknown"} — ${obs.observed_on || "n/a"}`;
      selectEl.appendChild(opt);
    });
  } else {
    selectEl.innerHTML = `<option>⚠️ No observations available</option>`;
  }

  // --- Generate QR Code + preview ---
  function updateQRCode(obs) {
    if (!obs) return;

    const detailUrl = `/poi/detail.html?obs=${obs.id}`;

    // Draw QR into canvas
    QRCode.toCanvas(
      qrCanvas,
      detailUrl,
      { width: 200 },
      function (error) {
        if (error) console.error(error);
      }
    );

    const photoUrl = obs.photos?.[0]?.url.replace("square", "small") || "";
    const species = obs.species_guess || "Unknown species";
    const observedOn = obs.observed_on || "n/a";
    const link = `https://www.inaturalist.org/observations/${obs.id}`;

    previewDiv.innerHTML = `
      <div style="margin-top: 1em;">
        ${photoUrl ? `<img src="${photoUrl}" alt="${species}" style="max-width:150px; display:block; margin-bottom:0.5em;">` : ""}
        <strong>${species}</strong> — ${observedOn}<br>
        <a href="${link}" target="_blank">View on iNaturalist</a><br>
        <a href="${detailUrl}" class="detail-link">${detailUrl}</a>
      </div>
    `;


    // Update registry entry
    const qrCodeUrl = `/assets/qrcodes/poi-${obs.id}.png`;
    const entry = {
      poi_id: obs.id,
      species_name: species,
      qr_code_url: qrCodeUrl,
      detail_url: detailUrl,
      inat_url: link
    };
    registry = registry.filter(r => r.poi_id !== obs.id).concat(entry);
  }

  // --- Dropdown change ---
  selectEl.addEventListener("change", () => {
    const obsId = selectEl.value;
    const obs = observations.find(o => String(o.id) === String(obsId));
    updateQRCode(obs);
  });

  // --- Download QR button ---
  downloadBtn.addEventListener("click", () => {
    const obsId = selectEl.value;
    if (!obsId) return;
    const obs = observations.find(o => String(o.id) === String(obsId));
    if (!obs) return;

    const link = document.createElement("a");
    link.download = `poi-${obs.id}.png`;
    link.href = qrCanvas.toDataURL("image/png");
    link.click();
  });

  // --- Export registry JSON ---
  exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(registry, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "index.json";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  });

  // --- Init ---
  if (observations.length > 0) {
    selectEl.value = observations[0].id;
    updateQRCode(observations[0]);
  }
});
