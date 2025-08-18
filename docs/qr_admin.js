document.addEventListener("DOMContentLoaded", () => {
  // --- QR Admin Script ---
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

  // --- Function to generate QR Code + preview ---
  function updateQRCode(obs) {
    if (!obs) return;

    const ctx = qrCanvas.getContext("2d");
    ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);

    QRCode.toCanvas(
      qrCanvas,
      `https://www.inaturalist.org/observations/${obs.id}`,
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
        <a href="${link}" target="_blank">View on iNaturalist</a>
      </div>
    `;
  }

  // --- Event listener for dropdown changes ---
  selectEl.addEventListener("change", () => {
    const obsId = selectEl.value;
    const obs = observations.find(o => String(o.id) === String(obsId));
    updateQRCode(obs);
  });

  // --- Initialize default selection ---
  if (observations.length > 0) {
    selectEl.value = observations[0].id;
    updateQRCode(observations[0]);
  }
});