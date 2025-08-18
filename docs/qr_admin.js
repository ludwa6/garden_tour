// docs/qr_admin.js
// Works with qr_admin.html that defines: #obsSelect, #qrcode, #preview
// Requires QRCodeJS (loaded in qr_admin.html)

document.addEventListener("DOMContentLoaded", () => {
  const obsSelect = document.getElementById("obsSelect");
  const qrContainer = document.getElementById("qrcode");
  const preview = document.getElementById("preview");

  if (!obsSelect || !qrContainer || !preview) {
    console.error("[QR Admin] Missing required elements. Check IDs: obsSelect, qrcode, preview.");
    return;
  }

  let observations = [];

  // --- Helpers ---
  const getRangeFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get("range") || "today";
  };

  const buildINatUrl = (projectId, range) => {
    let url =
      `https://api.inaturalist.org/v1/observations` +
      `?project_id=${projectId}` +
      `&order=desc&order_by=observed_on&per_page=200&quality_grade=any`;

    // If range=today|week, add d1 filter (start date)
    const now = new Date();
    if (range === "today") {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      url += `&d1=${d.toISOString().split("T")[0]}`;
    } else if (range === "week") {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      d.setDate(d.getDate() - 7);
      url += `&d1=${d.toISOString().split("T")[0]}`;
    }
    // (range=all → no d1)
    return url;
  };

  const loadFromLocalStorage = () => {
    try {
      const raw = localStorage.getItem("erc_observations");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const fetchFromINat = async (range) => {
    const projectId = 197410; // ERC Vale da Lama
    const url = buildINatUrl(projectId, range);
    console.log("[QR Admin] Fallback fetch:", url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data?.results) ? data.results : [];
  };

  const labelFor = (obs) => {
    const name = obs.species_guess || "Unknown species";
    const date = obs.observed_on || "n/a";
    return `${name} — ${date}`;
  };

  const smallPhotoFor = (obs) => {
    const url = obs?.photos?.[0]?.url;
    return url ? url.replace("square", "small") : null;
  };

  const iNatUrlFor = (obs) => `https://www.inaturalist.org/observations/${obs.id}`;

  const appDeepLinkFor = (obs) =>
    `https://ludwa6.github.io/garden_tour/index.html?obs=${obs.id}`;

  const clearNode = (el) => {
    while (el.firstChild) el.removeChild(el.firstChild);
  };

  const renderQRCode = (obs) => {
    clearNode(qrContainer);
    if (!window.QRCode) {
      console.error("[QR Admin] QRCode library not loaded.");
      return;
    }
    // Draw new code
    new QRCode(qrContainer, {
      text: appDeepLinkFor(obs),
      width: 240,
      height: 240,
      correctLevel: QRCode.CorrectLevel.M,
    });
  };

  const renderPreview = (obs) => {
    const img = smallPhotoFor(obs);
    const name = obs.species_guess || "Unknown species";
    const date = obs.observed_on || "n/a";
    const iNatLink = iNatUrlFor(obs);
    const appLink = appDeepLinkFor(obs);

    preview.innerHTML = `
      <div class="observation-item" style="max-width: 420px; margin: 0 auto;">
        ${img ? `<img src="${img}" alt="${name}">` : ""}
        <div style="text-align:left; width:100%;">
          <strong>${name}</strong> — ${date}<br>
          <a href="${iNatLink}" target="_blank" rel="noopener">View on iNaturalist</a>
          &nbsp;•&nbsp;
          <a href="${appLink}" target="_blank" rel="noopener">Open in app</a>
        </div>
      </div>
    `;
  };

  const populateDropdown = (list) => {
    obsSelect.innerHTML = "";
    if (!list.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No observations available";
      obsSelect.appendChild(opt);
      return;
    }
    for (const obs of list) {
      const opt = document.createElement("option");
      opt.value = String(obs.id);
      opt.textContent = labelFor(obs);
      obsSelect.appendChild(opt);
    }
  };

  const handleSelectChange = () => {
    const id = Number(obsSelect.value);
    const obs = observations.find((o) => o.id === id);
    if (!obs) return;
    renderQRCode(obs);
    renderPreview(obs);
  };

  // --- Init flow ---
  (async () => {
    // 1) Try to use the filtered set saved by index.html
    observations = loadFromLocalStorage();

    // 2) If nothing saved, fetch a reasonable set as fallback
    if (!observations.length) {
      try {
        const range = getRangeFromUrl();
        observations = await fetchFromINat(range);
      } catch (e) {
        console.error("[QR Admin] Failed to fetch observations:", e);
        observations = [];
      }
    }

    // 3) Populate UI
    populateDropdown(observations);

    // 4) Hook events
    obsSelect.addEventListener("change", handleSelectChange);

    // 5) Autoselect first item
    if (observations.length) {
      obsSelect.value = String(observations[0].id);
      handleSelectChange();
    }
  })();
});