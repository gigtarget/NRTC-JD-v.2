const aisleConfig = {
  A: { front: 3, back: 9 },
  B: { front: 3, back: 9 },
  C: { front: 3, back: 9 },
  D: { front: 3, back: 12 },
  E: { front: 7, back: 12 },
  F: { front: 7, back: 9 },
  G: { front: 7, back: 12 },
  H: { front: 7, back: 12 },
  I: { front: 7, back: 12 },
};

const aisleSpacing = 55;
const sectionSize = 20;
const padding = 2;
const offsetX = 10;
const svg = document.getElementById("aisles");
const searchBox = document.getElementById("searchBox");
const clearBtn = document.getElementById("clearBtn");

const totalAisles = Object.keys(aisleConfig).length;
svg.setAttribute("viewBox", `0 0 ${totalAisles * aisleSpacing} 550`);

function drawSections() {
  svg.innerHTML = "";
  let index = 0;
  for (let aisle in aisleConfig) {
    const { front, back } = aisleConfig[aisle];
    const x = offsetX + index++ * aisleSpacing;

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x + sectionSize);
    label.setAttribute("y", 15);
    label.setAttribute("class", "aisle-label");
    label.textContent = aisle;
    svg.appendChild(label);

    for (let i = 0; i < front; i++) {
      ["Left", "Right"].forEach((side, sIdx) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x + sIdx * (sectionSize + padding));
        rect.setAttribute("y", 30 + i * (sectionSize + padding));
        rect.setAttribute("width", sectionSize);
        rect.setAttribute("height", sectionSize);
        rect.setAttribute("class", "section");
        rect.setAttribute("data-key", `${aisle}-BeforeWalkway-${side}-${i + 1}`);
        svg.appendChild(rect);
      });
    }

    for (let i = 0; i < back; i++) {
      ["Left", "Right"].forEach((side, sIdx) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x + sIdx * (sectionSize + padding));
        rect.setAttribute("y", 220 + i * (sectionSize + padding));
        rect.setAttribute("width", sectionSize);
        rect.setAttribute("height", sectionSize);
        rect.setAttribute("class", "section");
        rect.setAttribute("data-key", `${aisle}-AfterWalkway-${side}-${i + 1}`);
        svg.appendChild(rect);
      });
    }
  }
}

function clearHighlights() {
  document.querySelectorAll(".section").forEach(el => el.classList.remove("highlight"));
}

async function searchItems() {
  const queries = searchBox.value
    .trim()
    .toUpperCase()
    .split(",")
    .map(q => q.trim())
    .filter(q => q);

  const res = await fetch("warehouse_inventory_map.csv");
  const text = await res.text();
  const rows = text.split("\n").slice(1);
  const data = rows.map(r => {
    const [code, aisle, level, block, side, section] = r.split(",").map(s => s.trim());
    return { code, aisle, block, side, section };
  });

  clearHighlights();
  document.getElementById("result").innerHTML = "";

  queries.forEach(q => {
    const matches = data.filter(r => r.code.toUpperCase() === q);

    if (matches.length) {
      const grouped = {};

      matches.forEach(m => {
        const { aisle, block, side, section } = m;
        const groupKey = `${aisle}-${side}`;
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(section);

        const blockKey = block === "Before Walkway" ? "BeforeWalkway" : "AfterWalkway";

        document.querySelectorAll(`[data-key="${aisle}-${blockKey}-${side}-${Number(section)}"]`)
          .forEach(el => el.classList.add("highlight"));
      });

      for (let key in grouped) {
        const [aisle, side] = key.split("-");
        const sections = grouped[key].map(Number).sort((a, b) => a - b).join(", ");
        const totalSections = grouped[key].length;
        document.getElementById("result").innerHTML +=
          `✅ <strong>${q}</strong><br>` +
          `➔ Aisle: <b>${aisle}</b> | Side: ${side} | Sections: ${sections} (Total: ${totalSections})<br><br>`;
      }
    } else {
      document.getElementById("result").innerHTML +=
        `⚠️ <strong>${q}</strong> - Item not found<br><br>`;
    }
  });
}

searchBox.addEventListener("input", () => {
  if (searchBox.value.trim()) {
    clearBtn.style.display = "inline";
    searchItems();
  } else {
    clearBtn.style.display = "none";
    clearHighlights();
    document.getElementById("result").innerHTML = "";
  }
});

clearBtn.addEventListener("click", () => {
  searchBox.value = "";
  clearBtn.style.display = "none";
  clearHighlights();
  document.getElementById("result").innerHTML = "";
});

// Initialize map
drawSections();
