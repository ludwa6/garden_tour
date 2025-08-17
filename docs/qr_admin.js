// --- QR Admin Page Script ---

document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById("observationDropdown");
  const qrDiv = document.getElementById("qrcode");
  const preview = document.getElementById("observationPreview");

  // --- Load observations saved from main page ---
  const saved = localStorage.getItem("erc_observations");
  let observations = [];
  try {
    observations = saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to parse saved observations:", e);
  }

  // --- Populate dropdown ---
  if (observations.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "No observations available (filter on main page first)";
    dropdown.appendChild(opt);
    dropdown.disabled = true;
  } else {
    observations.forEach(obs => {
      const opt = document.createElement("option");
      opt.value = obs.id;
      opt.textContent = `${obs.species_guess || "Unknown species"} — ${obs.observed_on || "n/a"}`;
      dropdown.appendChild(opt);
    });
  }

  // --- Handle selection change ---
  dropdown.addEventListener("change", () => {
    const id = dropdown.value;
    const obs = observations.find(o => o.id == id);

    if (obs) {
      // --- Generate QR Code ---
      qrDiv.innerHTML = "";
      new QRCode(qrDiv, {
        text: `https://www.inaturalist.org/observations/${obs.id}`,
        width: 256,
        height: 256
      });

      // --- Show image + link preview ---
      const imgUrl = obs.photos?.[0]?.url.replace("square", "small") || "";
      preview.innerHTML = `
        <a href="https://www.inaturalist.org/observations/${obs.id}" target="_blank">
          <img src="${imgUrl}" 
               alt="${obs.species_guess || 'Unknown species'}" 
               style="max-width:200px; display:block; margin:0.5em 0;" />
        </a>
        <div>
          <strong>${obs.species_guess || 'Unknown species'}</strong><br>
          Observed: ${obs.observed_on || 'n/a'}
        </div>
      `;
    }
  });

  // --- Auto-trigger first observation if available ---
  if (observations.length > 0) {
    dropdown.value = observations[0].id;
    dropdown.dispatchEvent(new Event("change"));
  }
});
