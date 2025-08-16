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
svg.setAttribute("viewBox", `0 0 ${totalAisles * aisleSpacing} 550`);

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

function updateSuggestions() {
  const term = searchBox.value.split(/[^A-Z0-9]+/g).pop().toUpperCase();
  const box = document.getElementById("suggestions");
  box.innerHTML = "";
  if (!term) { box.style.display = "none"; return; }
  const matches = allCodes.filter(code => code.startsWith(term));
  if (!matches.length) { box.style.display = "none"; return; }
  matches.slice(0, 10).forEach(code => {
    const div = document.createElement("div");
    div.textContent = code;
    div.addEventListener("mousedown", () => {
      const raw = searchBox.value;
      const upperRaw = raw.toUpperCase();
      const idx = upperRaw.lastIndexOf(term);
      const prefix = raw.slice(0, idx);
      searchBox.value = prefix + code;
      box.style.display = "none";
      searchItems();
    });
    box.appendChild(div);
  });
  box.style.display = "block";
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
    const matches = data.filter(r => r.code && r.code.toUpperCase() === q);

    if (matches.length) {
      const grouped = {};
      matches.forEach(m => {
        const { aisle, block, side, section } = m;
        const groupKey = `${aisle}-${side}`;
        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(Number(section));

        const blockKey = block === "Before Walkway" ? "BeforeWalkway" : "AfterWalkway";

        // Support Left/Right and L/R keys
        const sel = [
          `[data-key="${aisle}-${blockKey}-${side}-${Number(section)}"]`,
          `[data-key-short="${aisle}-${blockKey}-${side}-${Number(section)}"]`,
        ].join(",");

        document.querySelectorAll(sel).forEach(el => {
          el.classList.add("highlight");
          addPulseAtRect(el);
          totalHighlights++;
        });
      });

      for (let key in grouped) {
        const [aisle, side] = key.split("-");
        const sections = grouped[key].sort((a, b) => a - b).join(", ");
        const totalSections = grouped[key].length;
        const card = document.createElement("div");
        card.className = "result-card found";
        card.innerHTML =
          `✅ <strong>${q}</strong><br>` +
          `➔ Aisle: <b>${aisle}</b> | Side: ${side} | Sections: ${sections} (Total: ${totalSections})`;
        resultBox.appendChild(card);
      }
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
  } else {
    clearBtn.style.display = "none";
    clearHighlights();
    document.getElementById("result").innerHTML = "";
  }
  updateSuggestions();
});
searchBox.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    const term = searchBox.value.split(/[^A-Z0-9]+/g).pop().toUpperCase();
    if (term && !allCodes.includes(term)) {
      const suggestion = allCodes.find(code => code.startsWith(term));
      if (suggestion) {
        const raw = searchBox.value;
        const upperRaw = raw.toUpperCase();
        const idx = upperRaw.lastIndexOf(term);
        const prefix = raw.slice(0, idx);
        searchBox.value = prefix + suggestion;
      }
    }
    document.getElementById("suggestions").style.display = "none";
    searchItems();
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
  document.getElementById("suggestions").style.display = "none";
});

document.addEventListener("click", e => {
  const wrapper = document.querySelector(".input-wrapper");
  if (wrapper && !wrapper.contains(e.target)) {
    document.getElementById("suggestions").style.display = "none";
  }
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
