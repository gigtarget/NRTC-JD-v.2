// --- Original geometry (ratio/sizing) ---
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
const topFrontY = 30;
const backStartY = 220;

const svg = document.getElementById("aisles");
const searchBox = document.getElementById("searchBox");
const clearBtn = document.getElementById("clearBtn");
const themeBtn = document.getElementById("themeToggle");

let inventoryData = [];
let allCodes = [];

const totalAisles = Object.keys(aisleConfig).length;
const maxBack = Math.max(...Object.values(aisleConfig).map(a => a.back));
const hoopingStartY = backStartY + maxBack * (sectionSize + padding) + 40;
// extend viewBox and explicit height so extra bottom row is visible
const viewWidth = totalAisles * aisleSpacing;
const viewHeight = hoopingStartY + sectionSize + 40;
svg.setAttribute("viewBox", `0 0 ${viewWidth} ${viewHeight}`);
svg.style.height = `${viewHeight}px`;

async function loadInventoryData() {
  try {
    const res = await fetch("warehouse_inventory_map.csv", { cache: "no-store" });
    const text = await res.text();
    const rows = text.split("\n").slice(1);
    inventoryData = rows
      .map(r => {
        const parts = r.split(",").map(s => (s ? s.trim() : ""));
        if (parts.length < 6) return null;
        const [code, aisle, level, block, side, section] = parts;
        return { code, aisle, block, side, section };
      })
      .filter(Boolean);
    allCodes = [...new Set(inventoryData.map(r => r.code))].sort();
    const dl = document.getElementById("itemSuggestions");
    dl.innerHTML = "";
    allCodes.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      dl.appendChild(opt);
    });
  } catch {
    inventoryData = [];
    allCodes = [];
  }
}

// ---- Pulse overlay helpers (visual only) ----
let pulseLayer = null;
function ensurePulseLayer() {
  if (!pulseLayer) {
    pulseLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    pulseLayer.setAttribute("id", "pulseLayer");
    svg.appendChild(pulseLayer);
  }
}
function addPulseAtRect(rect, color = "rgba(16,185,129,.9)") {
  ensurePulseLayer();
  const x = parseFloat(rect.getAttribute("x")) || 0;
  const y = parseFloat(rect.getAttribute("y")) || 0;
  const w = parseFloat(rect.getAttribute("width")) || sectionSize;
  const h = parseFloat(rect.getAttribute("height")) || sectionSize;
  const cx = x + w/2, cy = y + h/2;
  const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  ring.setAttribute("cx", cx);
  ring.setAttribute("cy", cy);
  ring.setAttribute("r", 2);
  ring.setAttribute("class", "pulse-ring");
  ring.setAttribute("fill", "none");
  ring.setAttribute("stroke", color);
  pulseLayer.appendChild(ring);
  setTimeout(() => ring.remove(), 1200);
}
function redCenterPulse() {
  ensurePulseLayer();
  const vb = (svg.getAttribute("viewBox") || "0 0 530 550").split(" ").map(Number);
  const cx = vb[2] / 2, cy = vb[3] / 2;
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", 0);
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke", "rgba(244,63,94,.85)");
  circle.setAttribute("stroke-width", 2);
  circle.style.animation = "pulseErrKf 0.9s ease-out 1";
  pulseLayer.appendChild(circle);
  setTimeout(() => circle.remove(), 900);
}

// ---- Draw map (original layout; modest corners) ----
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

    // Top (Before Walkway)
    for (let i = 0; i < front; i++) {
      ["Left", "Right"].forEach((side, sIdx) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x + sIdx * (sectionSize + padding));
        rect.setAttribute("y", topFrontY + i * (sectionSize + padding));
        rect.setAttribute("width", sectionSize);
        rect.setAttribute("height", sectionSize);
        rect.setAttribute("rx", 4);
        rect.setAttribute("ry", 4);
        rect.setAttribute("class", "section");
        rect.setAttribute("data-key", `${aisle}-BeforeWalkway-${side}-${i + 1}`);
        rect.setAttribute("data-key-short", `${aisle}-BeforeWalkway-${side[0]}-${i + 1}`);
        svg.appendChild(rect);
      });
    }

    // Bottom (After Walkway)
    for (let i = 0; i < back; i++) {
      ["Left", "Right"].forEach((side, sIdx) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x + sIdx * (sectionSize + padding));
        rect.setAttribute("y", backStartY + i * (sectionSize + padding));
        rect.setAttribute("width", sectionSize);
        rect.setAttribute("height", sectionSize);
        rect.setAttribute("rx", 4);
        rect.setAttribute("ry", 4);
        rect.setAttribute("class", "section");
        rect.setAttribute("data-key", `${aisle}-AfterWalkway-${side}-${i + 1}`);
        rect.setAttribute("data-key-short", `${aisle}-AfterWalkway-${side[0]}-${i + 1}`);
        svg.appendChild(rect);
      });
    }
  }

  // Extra bottom row: Hooping Station block + surrounding sections
  let hsX = offsetX;
  let hsIndex = 1;
  const addHsSection = x => {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
  // Extra bottom row: Hooping Station
  const hsLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
  hsLabel.setAttribute("x", offsetX);
  hsLabel.setAttribute("y", hoopingStartY + sectionSize - 4);
  hsLabel.setAttribute("class", "aisle-label");
  hsLabel.textContent = "Hooping Station";
  svg.appendChild(hsLabel);

  const hsStartX = offsetX + 110; // leave space for label
  const hsSections = 6;
  for (let i = 0; i < hsSections; i++) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", hsStartX + i * (sectionSize + padding));
    rect.setAttribute("y", hoopingStartY);
    rect.setAttribute("width", sectionSize);
    rect.setAttribute("height", sectionSize);
    rect.setAttribute("rx", 4);
    rect.setAttribute("ry", 4);
    rect.setAttribute("class", "section");
    rect.setAttribute("data-key", `HS-AfterWalkway-Left-${hsIndex}`);
    rect.setAttribute("data-key-short", `HS-AfterWalkway-L-${hsIndex}`);
    svg.appendChild(rect);
    hsIndex++;
  };

  // first 3 small blocks
  for (let i = 0; i < 3; i++) {
    addHsSection(hsX);
    hsX += sectionSize + padding;
  }

  // big hooping station block
  const bigWidth = (sectionSize + padding) * 4 - padding;
  const bigRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bigRect.setAttribute("x", hsX);
  bigRect.setAttribute("y", hoopingStartY);
  bigRect.setAttribute("width", bigWidth);
  bigRect.setAttribute("height", sectionSize);
  bigRect.setAttribute("rx", 4);
  bigRect.setAttribute("ry", 4);
  bigRect.setAttribute("class", "hooping-block");
  svg.appendChild(bigRect);

  const hsText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  hsText.setAttribute("x", hsX + bigWidth / 2);
  hsText.setAttribute("y", hoopingStartY + sectionSize / 2);
  hsText.setAttribute("class", "hooping-text");
  hsText.setAttribute("text-anchor", "middle");
  hsText.setAttribute("dominant-baseline", "middle");
  hsText.textContent = "Hooping Station";
  svg.appendChild(hsText);

  hsX += bigWidth + padding;

  // next 3 small blocks
  for (let i = 0; i < 3; i++) {
    addHsSection(hsX);
    hsX += sectionSize + padding;
  }

  // final single block
  addHsSection(hsX);

    rect.setAttribute("data-key", `HS-AfterWalkway-Left-${i + 1}`);
    rect.setAttribute("data-key-short", `HS-AfterWalkway-L-${i + 1}`);
    svg.appendChild(rect);
  }

  pulseLayer = null; // keep pulses above
  ensurePulseLayer();
}

// ---- Clear / Search (original behavior) ----
function clearHighlights() {
  document.querySelectorAll(".section").forEach(el => el.classList.remove("highlight"));
  if (pulseLayer) pulseLayer.innerHTML = "";
}

async function searchItems() {
  const queries = searchBox.value
    .trim()
    .toUpperCase()
    .split(/[^A-Z0-9]+/g)
    .map(q => q.trim())
    .filter(q => q);

  const data = inventoryData;

  clearHighlights();
  const resultBox = document.getElementById("result");
  resultBox.innerHTML = "";

  let totalHighlights = 0;

  queries.forEach(q => {
    const matches = data.filter(r => r.code && r.code.toUpperCase().startsWith(q));

    if (matches.length) {
      const byCode = {};
      matches.forEach(m => {
        const code = m.code.toUpperCase();
        if (!byCode[code]) byCode[code] = [];
        byCode[code].push(m);

        const blockKey = m.block === "Before Walkway" ? "BeforeWalkway" : "AfterWalkway";
        const sel = [
          `[data-key="${m.aisle}-${blockKey}-${m.side}-${Number(m.section)}"]`,
          `[data-key-short="${m.aisle}-${blockKey}-${m.side}-${Number(m.section)}"]`,
        ].join(",");

        document.querySelectorAll(sel).forEach(el => {
          el.classList.add("highlight");
          addPulseAtRect(el);
          totalHighlights++;
        });
      });

      Object.keys(byCode).forEach(code => {
        const grouped = {};
        byCode[code].forEach(m => {
          const { aisle, side, section } = m;
          const groupKey = `${aisle}-${side}`;
          if (!grouped[groupKey]) grouped[groupKey] = [];
          grouped[groupKey].push(Number(section));
        });

        for (let key in grouped) {
          const [aisle, side] = key.split("-");
          const sections = grouped[key].sort((a, b) => a - b).join(", ");
          const totalSections = grouped[key].length;
          const card = document.createElement("div");
          card.className = "result-card found";
          card.innerHTML =
            `✅ <strong>${code}</strong><br>` +
            `➔ Aisle: <b>${aisle}</b> | Side: ${side} | Sections: ${sections} (Total: ${totalSections})`;
          resultBox.appendChild(card);
        }
      });
    } else {
      const card = document.createElement("div");
      card.className = "result-card notfound";
      card.innerHTML = `⚠️ <strong>${q}</strong> - Item not found`;
      resultBox.appendChild(card);
    }
  });

  if (queries.length > 0 && totalHighlights === 0) {
    redCenterPulse();
  }
}

// Input events (unchanged)
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
searchBox.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const val = searchBox.value.trim().toUpperCase();
    if (!allCodes.includes(val)) {
      const suggestion = allCodes.find(code => code.startsWith(val));
      if (suggestion) {
        e.preventDefault();
        searchBox.value = suggestion;
        searchItems();
      }
    }
  }
});
clearBtn.addEventListener("click", () => {
  searchBox.value = "";
  clearBtn.style.display = "none";
  clearHighlights();
  document.getElementById("result").innerHTML = "";
});

// Theme toggle (style-only)
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("wal-theme", isDark ? "dark" : "light");
  });
}

// Init
drawSections();
loadInventoryData();
