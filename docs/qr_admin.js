// qr_admin.js

// --- Load observations from localStorage (set by index.html) ---
const obsSelect = document.getElementById("obsSelect");
const qrCanvas = document.getElementById("qrCanvas");

let observations = [];
try {
  const stored = localStorage.getItem("erc_observations");
  if (stored) {
    observations = JSON.parse(stored);
    console.log(`[QR Admin] Loaded ${observations.length} observations from localStorage`);
  } else {
    console.warn("[QR Admin] No observations found in localStorage");
  }
} catch (e) {
  console.error("[QR Admin] Failed to parse localStorage data", e);
}

// --- Populate dropdown ---
function populateDropdown() {
  obsSelect.innerHTML = ""; // clear old options

  if (observations.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No observations available";
    obsSelect.appendChild(opt);
    return;
  }

  observations.forEach(obs => {
    const opt = document.createElement("option");
    opt.value = obs.id;
    opt.textContent = `${obs.species_guess || "Unknown species"} — ${obs.observed_on || "n/a"}`;
    obsSelect.appendChild(opt);
  });
}

// --- Generate QR Code for selected observation ---
function generateQR(obsId) {
  const obs = observations.find(o => o.id == obsId);
  if (!obs) {
    console.warn("[QR Admin] No observation found for ID:", obsId);
    qrCanvas.getContext("2d").clearRect(0, 0, qrCanvas.width, qrCanvas.height);
    return;
  }

  const url = `https://www.inaturalist.org/observations/${obs.id}`;
  console.log("[QR Admin] Generating QR for", url);

  QRCode.toCanvas(qrCanvas, url, { width: 256 }, function (error) {
    if (error) console.error(error);
    else console.log("[QR Admin] QR Code rendered");
  });
}

// --- Event listener for dropdown changes ---
obsSelect.addEventListener("change", () => {
  if (obsSelect.value) {
    generateQR(obsSelect.value);
  }
});

// --- Initialize page ---
populateDropdown();
