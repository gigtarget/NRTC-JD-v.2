const aisleConfig = {
  A: { front: 3, back: 9 },
  B: { front: 3, back: 9 },
  C: { front: 3, back: 9 },
  D: { front: 4, back: 12 },
  E: { front: 7, back: 12 },
  F: { front: 7, back: 12 },
  G: { front: 7, back: 12 },
  H: { front: 7, back: 12 },
  I: { front: 7, back: 12 },
};

const aisleSpacing = 55;
const sectionSize = 20;
const padding = 2;
const offsetX = 10;
const svg = document.getElementById("aisles");

const totalAisles = Object.keys(aisleConfig).length;
const dynamicViewBoxWidth = totalAisles * aisleSpacing;
svg.setAttribute("viewBox", `0 0 ${dynamicViewBoxWidth} 550`);

function drawSections() {
  let index = 0;
  for (let aisle in aisleConfig) {
    const { front, back } = aisleConfig[aisle];
    const x = offsetX + index * aisleSpacing;

    // Aisle Label
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x + sectionSize);
    label.setAttribute("y", 15);
    label.setAttribute("class", "aisle-label");
    label.textContent = aisle;
    svg.appendChild(label);

    // FRONT
    for (let i = 0; i < front; i++) {
      ["Left", "Right"].forEach((side, sIndex) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x + sIndex * (sectionSize + padding));
        rect.setAttribute("y", 30 + i * (sectionSize + padding));
        rect.setAttribute("width", sectionSize);
        rect.setAttribute("height", sectionSize);
        rect.setAttribute("class", "section");
        rect.setAttribute("id", `${aisle}-Top-BeforeWalkway-${side}-${i + 1}`);
        svg.appendChild(rect);
      });
    }

    // BACK
    for (let i = 0; i < back; i++) {
      ["Left", "Right"].forEach((side, sIndex) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x + sIndex * (sectionSize + padding));
        rect.setAttribute("y", 220 + i * (sectionSize + padding));
        rect.setAttribute("width", sectionSize);
        rect.setAttribute("height", sectionSize);
        rect.setAttribute("class", "section");
        rect.setAttribute("id", `${aisle}-Top-AfterWalkway-${side}-${i + 1}`);
        svg.appendChild(rect);
      });
    }

    index++;
  }
}

function clearHighlights() {
  document.querySelectorAll(".section").forEach(el => el.classList.remove("highlight"));
}

async function searchItems(codes) {
  const response = await fetch("warehouse_inventory_map.csv");
  const text = await response.text();
  const rows = text.split("\n").slice(1);
  const data = rows.map(row => {
    const [code, aisle, level, block, side, section] = row.split(",").map(s => s.trim());
    return { code, aisle, level, block, side, section };
  });

  clearHighlights();
  const resultBox = document.getElementById("result");
  let foundItems = [];
  let notFoundItems = [];

  codes.forEach(code => {
    const match = data.find(r => r.code === code);
    if (match) {
      const { aisle, level, block, side, section } = match;
      let highlightId = "";

      if (level && block && side && section) {
        highlightId = `${aisle}-${level}-${block.replace(/\s/g, '')}-${side}-${section}`;
      } else {
        highlightId = null;
        document.querySelectorAll(`[id^="${aisle}-"]`).forEach(el => el.classList.add("highlight"));
      }

      if (highlightId) {
        const el = document.getElementById(highlightId);
        if (el) el.classList.add("highlight");
      }

      foundItems.push(code);
    } else {
      notFoundItems.push(code);
    }
  });

  resultBox.innerHTML = `
    ✅ Found: ${foundItems.join(", ")} <br>
    ${notFoundItems.length ? `⚠️ Not Found: ${notFoundItems.join(", ")}` : ''}
  `;
}

document.getElementById("searchBox").addEventListener("input", () => {
  const query = document.getElementById("searchBox").value.trim().toUpperCase();
  const codes = query.split(",").map(code => code.trim()).filter(Boolean);
  if (codes.length > 0) {
    searchItems(codes);
  } else {
    clearHighlights();
    document.getElementById("result").innerHTML = "";
  }
});

drawSections();
