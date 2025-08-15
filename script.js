// === Layout (same aisles, just visual tweaks in draw) ===
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

const aisleSpacing = 70;   // a little wider for airy look
const sectionSize = 26;    // slightly bigger squares
const padding = 4;
const offsetX = 36;
const svg = document.getElementById("aisles");
const searchBox = document.getElementById("searchBox");
const clearBtn = document.getElementById("clearBtn");
const themeBtn = document.getElementById("themeToggle");

const totalAisles = Object.keys(aisleConfig).length;
svg.setAttribute("viewBox", `0 0 ${totalAisles * aisleSpacing + offsetX * 2} 560`);

function drawSections() {
  svg.innerHTML = "";
  let index = 0;
  for (let aisle in aisleConfig) {
    const { front, back } = aisleConfig[aisle];
    const x = offsetX + index++ * aisleSpacing;

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", x + sectionSize / 2);
    label.setAttribute("y", 22);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("class", "aisle-label");
    label.textContent = aisle;
    svg.appendChild(label);

    // Top (Before Walkway)
    for (let i = 0; i < front; i++) {
      ["Left", "Right"].forEach((side, sIdx) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x + sIdx * (sectionSize + padding));
        rect.setAttribute("y", 40 + i * (sectionSize + padding));
        rect.setAttribute("width", sectionSize);
        rect.setAttribute("height", sectionSize);
        rect.setAttribute("rx", 7); // rounded corners (SVG attr)
        rect.setAttribute("ry", 7);
        rect.setAttribute("class", "section");
        rect.setAttribute("data-key", `${aisle}-BeforeWalkway-${side}-${i + 1}`);
        // compat keys (L/R) in case CSV uses letters
        rect.setAttribute("data-key-short", `${aisle}-BeforeWalkway-${side[0]}-${i + 1}`);
        svg.appendChild(rect);
      });
    }

    // Bottom (After Walkway)
    for (let i = 0; i < back; i++) {
      ["Left", "Right"].forEach((side, sIdx) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x + sIdx * (sectionSize + padding));
        rect.setAttribute("y", 260 + i * (sectionSize + padding));
        rect.setAttribute("width", sectionSize);
        rect.setAttribute("height", sectionSize);
        rect.setAttribute("rx", 7);
        rect.setAttribute("ry", 7);
        rect.setAttribute("class", "section");
        rect.setAttribute("data-key", `${aisle}-AfterWalkway-${side}-${i + 1}`);
        rect.setAttribute("data-key-short", `${aisle}-AfterWalkway-${side[0]}-${i + 1}`);
        svg.appendChild(rect);
      });
    }
  }
  pulseLayer = null; // recreate pulses layer on top
  ensurePulseLayer();
}

// ---- Pulse overlay helpers (visuals only) ----
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
  const cx = x + w / 2, cy = y + h / 2;

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
  const vb = (svg.getAttribute("viewBox") || "0 0 600 560").split(" ").map(Number);
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

  // Load CSV (original endpoint expected)
  let text = "";
  try {
    const res = await fetch("warehouse_inventory_map.csv", { cache: "no-store" });
    text = await res.text();
  } catch (e) {
    text = "Item Code,Aisle,Level,Block,Side,Section\n"; // no data
  }

  const rows = text.split("\n").slice(1);
  const data = rows
    .map(r => {
      const parts = r.split(",").map(s => (s ? s.trim() : ""));
      if (parts.length < 6) return null;
      const [code, aisle, level, block, side, section] = parts;
      return { code, aisle, block, side, section };
    })
    .filter(Boolean);

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

        // Try both 'Left/Right' and 'L/R' keys to be safe
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
        resultBox.innerHTML +=
          `✅ <strong>${q}</strong><br>` +
          `➔ Aisle: <b>${aisle}</b> | Side: ${side} | Sections: ${sections} (Total: ${totalSections})<br><br>`;
      }
    } else {
      resultBox.innerHTML += `⚠️ <strong>${q}</strong> - Item not found<br><br>`;
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
