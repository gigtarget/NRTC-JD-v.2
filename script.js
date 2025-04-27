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
  svg.innerHTML = "";

  let index = 0;
  for (let aisle in aisleConfig) {
    const { front, back } = aisleConfig[aisle];
    const x = offsetX + index * aisleSpacing;

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
  try {
    const response = await fetch("warehouse_inventory_map.csv");
    const text = await response.text();
    const rows = text.split("\n").slice(1);
    const data = rows.map(row => {
      const [code, aisle, level, block, side, section] = row.split(",").map(s => s.trim());
      return { code, aisle, level, block, side, section };
    });

    clearHighlights();
    const resultBox = document.getElementById("result");
    resultBox.innerHTML = "";

    let foundItems = [];
    let notFoundItems = [];

    codes.forEach(code => {
      const match = data.find(r => r.code === code);
      if (match) {
        const { aisle, level, block, side, section } = match;
        let highlightId = "";

        // 🔥 FIXED: only check for Section + Aisle available
        if (aisle && section && block && side) {
          highlightId = `${aisle}-${level || 'Top'}-${block.replace(/\s/g, '')}-${side}-${section}`;

          const el = document.getElementById(highlightId);
          if (el) {
            el.classList.add("highlight");
          } else {
            // If exact section id not found, highlight entire aisle
            document.querySelectorAll(`[id^="${aisle}-"]`).forEach(el => el.classList.add("highlight"));
          }
        } else {
          // Highlight entire aisle if missing info
          document.querySelectorAll(`[id^="${aisle}-"]`).forEach(el => el.classList.add("highlight"));
        }

        foundItems.push(code);
      } else {
        notFoundItems.push(code);
      }
    });

    foundItems.forEach(code => {
      const card = document.createElement('div');
      card.className = 'result-card found';
      card.textContent = `✅ Found: ${code}`;
      resultBox.appendChild(card);
    });

    notFoundItems.forEach(code => {
      const card = document.createElement('div');
      card.className = 'result-card notfound';
      card.textContent = `⚠️ Not Found: ${code}`;
      resultBox.appendChild(card);
    });

  } catch (error) {
    console.error("Error loading CSV:", error);
    document.getElementById("result").innerHTML = "⚠️ Error loading data.";
  }
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

// Draw the map on page load
drawSections();
