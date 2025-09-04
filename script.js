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
const jGroupGap = 24;

const svg = document.getElementById("aisles");
const searchBox = document.getElementById("searchBox");
const clearBtn = document.getElementById("clearBtn");
const themeBtn = document.getElementById("themeToggle");
const POPUP_VERSION = "1";

let inventoryData = [];
let allCodes = [];

const totalAisles = Object.keys(aisleConfig).length;
const maxBack = Math.max(...Object.values(aisleConfig).map(a => a.back));
const hoopingStartY = backStartY + maxBack * (sectionSize + padding) + 40;
// extend viewBox so extra bottom row is visible
const viewWidth = totalAisles * aisleSpacing;
const viewHeight = hoopingStartY + sectionSize + 40;
svg.setAttribute("viewBox", `0 0 ${viewWidth} ${viewHeight}`);
// rely on CSS for height to avoid extra whitespace

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

  // Bottom row: aisle J with Hooping Station
  const colX = (aisleLetter, sideIdx = 0) => {
    const idx = "ABCDEFGHI".indexOf(aisleLetter);
    return offsetX + idx * aisleSpacing + sideIdx * (sectionSize + padding);
  };
  let jIndex = 1;
  const addJSection = x => {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", hoopingStartY);
    rect.setAttribute("width", sectionSize);
    rect.setAttribute("height", sectionSize);
    rect.setAttribute("rx", 4);
    rect.setAttribute("ry", 4);
    rect.setAttribute("class", "section");
    rect.setAttribute("data-key", `J-AfterWalkway-Right-${jIndex}`);
    rect.setAttribute("data-key-short", `J-AfterWalkway-R-${jIndex}`);
    svg.appendChild(rect);

    // leave boxes blank (no text labels) like other aisles
    jIndex++;
  };

  // Group 1 (J1–J3) placed contiguously
  {
    const startX = colX("A", 0);
    [0, 1, 2].forEach(i => addJSection(startX + i * (sectionSize + padding)));
  }

  // Group 2: Hooping Station block spanning C-left..D-right
  const bigX = colX("C",0);
  const bigWidth = colX("E",0) - bigX - jGroupGap; // span C-left..D-right
  const bigRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bigRect.setAttribute("x", bigX);
  bigRect.setAttribute("y", hoopingStartY);
  bigRect.setAttribute("width", bigWidth);
  bigRect.setAttribute("height", sectionSize);
  bigRect.setAttribute("rx", 4);
  bigRect.setAttribute("ry", 4);
  bigRect.setAttribute("class", "hooping-block");
  svg.appendChild(bigRect);
  const hsText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  hsText.setAttribute("x", bigX + bigWidth / 2);
  hsText.setAttribute("y", hoopingStartY + sectionSize / 2);
  hsText.setAttribute("class", "hooping-text");
  hsText.setAttribute("text-anchor", "middle");
  hsText.setAttribute("dominant-baseline", "middle");
  hsText.textContent = "Hooping Station";
  svg.appendChild(hsText);

  // Group 3 (J4–J6) placed contiguously
  {
    const startX = colX("E", 0);
    [0, 1, 2].forEach(i => addJSection(startX + i * (sectionSize + padding)));
  }

  // Group 4 (H-Left)
  addJSection(colX("H",0));

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

function initFeaturePopup() {
  const stored = localStorage.getItem("featurePopupVersion");
  if (stored === POPUP_VERSION) return;
  const popup = document.getElementById("feature-popup");
  const dismiss = document.getElementById("feature-popup-dismiss");
  const close = document.getElementById("feature-popup-close");
  if (!popup || !dismiss) return;
  popup.classList.remove("hidden");
  dismiss.addEventListener("click", () => {
    localStorage.setItem("featurePopupVersion", POPUP_VERSION);
    popup.classList.add("hidden");
  });
  if (close) {
    close.addEventListener("click", () => {
      popup.classList.add("hidden");
    });
  }
}

// Init
drawSections();
loadInventoryData();
initFeaturePopup();
