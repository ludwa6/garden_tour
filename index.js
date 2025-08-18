// index.js - loads and renders observations on the main page
document.addEventListener("DOMContentLoaded", () => {
  const obsContainer = document.getElementById("observations");
  if (!obsContainer) return;

  // Example: replace with your actual data source
  const data = [
    {
      id: 1,
      title: "Wildflower",
      img: "https://placehold.co/300x200?text=Wildflower",
      link: "#"
    },
    {
      id: 2,
      title: "Butterfly",
      img: "https://placehold.co/300x200?text=Butterfly",
      link: "#"
    }
  ];

  obsContainer.innerHTML = data
    .map(
      (d) => `
      <div class="observation-item">
        <img src="${d.img}" alt="${d.title}">
        <div class="obs">
          <a href="${d.link}" target="_blank">${d.title}</a>
        </div>
      </div>
    `
    )
    .join("");
});
