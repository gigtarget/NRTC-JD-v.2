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

// set responsive viewBox
const totalAisles = Object.keys(aisleConfig).length;
svg.setAttribute(
  "viewBox",
  `0 0 ${totalAisles * aisleSpacing} 550`
);

function drawSections() {
  svg.innerHTML = "";
  let index = 0;
  for (let aisle in aisleConfig) {
    const { front, back } = aisleConfig[aisle];
    const x = offsetX + index++ * aisleSpacing;

    // Aisle label
    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.setAttribute("x", x + sectionSize);
    label.setAttribute("y", 15);
    label.setAttribute("class", "aisle-label");
    label.textContent = aisle;
    svg.appendChild(label);

    // Front block (BeforeWalkway)
    for (let i = 0; i < front; i++) {
      ["Left", "Right"].forEach((side, sIdx) => {
        const rect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        rect.setAttribute("x", x + sIdx * (sectionSize + padding));
        rect.setAttribute("y", 30 + i * (sectionSize + padding));
        rect.setAttribute("width", sectionSize);
        rect.setAttribute("height", sectionSize);
        rect.setAttribute("class", "section");
        const blockType = "BeforeWalkway";
        rect.setAttribute(
          "data-key",
          `${aisle}-${blockType}-${side}-${i + 1}`
        );
        // optional debugging ID
        rect.setAttribute(
          "id",
          `${aisle}-Top-${blockType}-${side}-${i + 1}`
        );
        svg.appendChild(rect);
      });
    }

    // Back block (AfterWalkway)
    for (let i = 0; i < back; i++) {
      ["Left", "Right"].forEach((side, sIdx) => {
        const rect = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        rect.setAttribute("x", x + sIdx * (sectionSize + padding));
        rect.setAttribute("y", 220 + i * (sectionSize + padding));
        rect.setAttribute("width", sectionSize);
        rect.setAttribute("height", sectionSize);
        rect.setAttribute("class", "section");
        const blockType = "AfterWalkway";
        rect.setAttribute(
          "data-key",
          `${aisle}-${blockType}-${side}-${i + 1}`
        );
        rect.setAttribute(
          "id",
          `${aisle}-Top-${blockType}-${side}-${i + 1}`
        );
        svg.appendChild(rect);
      });
    }
  }
}

function clearHighlights() {
  document
    .querySelectorAll(".section")
    .forEach((el) => el.classList.remove("highlight"));
}

async function searchItems() {
  const queries = searchBox.value
    .trim()
    .toUpperCase()
    .split(",")
    .map((q) => q.trim())
    .filter((q) => q);

  const res = await fetch("warehouse_inventory_map.csv");
  const text = await res.text();
  const rows = text.split("\n").slice(1);
  const data = rows.map((r) => {
    const [code, aisle, level, block, side, section] = r
      .split(",")
      .map((s) => s.trim());
    return { code, aisle, level, block, side, section };
  });

  clearHighlights();
  document.getElementById("result").innerHTML = "";

  queries.forEach((q) => {
    const matches = data.filter((r) => r.code.toUpperCase() === q);
    if (matches.length) {
      const grouped = {};
      matches.forEach((m) => {
        const key = `${m.aisle}|${m.level}|${m.block}|${m.side}`;
        grouped[key] = grouped[key] || [];
        grouped[key].push(m.section);

        // highlight BOTH front & back rects
        const cleanBlock = m.block.replace(/\s/g, "");
        const dataKey = `${m.aisle}-${cleanBlock}-${m.side}-${m.section}`;
        document
          .querySelectorAll(`[data-key="${dataKey}"]`)
          .forEach((el) => el.classList.add("highlight"));
      });

      for (let k in grouped) {
        const [aisle, level, block, side] = k.split("|");
        const list = grouped[k].sort((a, b) => +a - +b).join(", ");
        const total = grouped[k].length;
        document.getElementById("result").innerHTML +=
          `✅ <strong>${q}</strong>\n` +
          `➔ Aisle: <b>${aisle}</b> | Level: ${level} | Block: ${block} | Side: ${side} | Sections: ${list} (Total: ${total})<br><br>`;
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

document
  .getElementById("feedbackForm")
  .addEventListener("submit", (e) => {
    e.preventDefault();
    fetch(e.target.action, {
      method: "POST",
      body: new FormData(e.target),
      headers: { Accept: "application/json" },
    })
      .then((r) => {
        if (r.ok) {
          e.target.style.display = "none";
          document.getElementById("thankYouMessage").style.display = "block";
        } else {
          alert("⚠️ Error submitting feedback.");
        }
      })
      .catch(() => alert("⚠️ Network error."));
  });

// draw on load
drawSections();
