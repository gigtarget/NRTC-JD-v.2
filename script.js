
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
const dynamicViewBoxWidth = totalAisles * aisleSpacing;
svg.setAttribute("viewBox", 0 0 ${dynamicViewBoxWidth} 550);

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

    for (let i = 0; i < front; i++) {
      ["Left", "Right"].forEach((side, sIndex) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x + sIndex * (sectionSize + padding));
        rect.setAttribute("y", 30 + i * (sectionSize + padding));
        rect.setAttribute("width", sectionSize);
        rect.setAttribute("height", sectionSize);
        rect.setAttribute("class", "section");
        rect.setAttribute("id", ${aisle}-Top-BeforeWalkway-${side}-${i + 1});
        svg.appendChild(rect);
      });
    }

    for (let i = 0; i < back; i++) {
      ["Left", "Right"].forEach((side, sIndex) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x + sIndex * (sectionSize + padding));
        rect.setAttribute("y", 220 + i * (sectionSize + padding));
        rect.setAttribute("width", sectionSize);
        rect.setAttribute("height", sectionSize);
        rect.setAttribute("class", "section");
        rect.setAttribute("id", ${aisle}-Top-AfterWalkway-${side}-${i + 1});
        svg.appendChild(rect);
      });
    }

    index++;
  }
}

function clearHighlights() {
  document.querySelectorAll(".section").forEach(el => el.classList.remove("highlight"));
}

async function searchItems() {
  const input = searchBox.value.trim().toUpperCase();
  const queries = input.split(",").map(q => q.trim()).filter(q => q);
  const response = await fetch("warehouse_inventory_map.csv");
  const text = await response.text();
  const rows = text.split("\n").slice(1);
  const data = rows.map(row => {
    const [code, aisle, level, block, side, section] = row.split(",").map(s => s.trim());
    return { code, aisle, level, block, side, section };
  });

  const resultBox = document.getElementById("result");
  clearHighlights();
  resultBox.innerHTML = "";

  queries.forEach(query => {
    const matches = data.filter(r => r.code.toUpperCase() === query);

    if (matches.length > 0) {
      const grouped = {};

      matches.forEach(match => {
        const { aisle, level, block, side, section } = match;
        const key = ${aisle}|${level}|${block}|${side};

        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(section);

        // Highlight each section
        if (block && side && section) {
          const highlightId = ${aisle}-Top-${block.replace(/\s/g, '')}-${side}-${section};
          const el = document.getElementById(highlightId);
          if (el) el.classList.add("highlight");
        }
      });

      // Output one line per grouped info
      for (let key in grouped) {
        const [aisle, level, block, side] = key.split("|");
        const sections = grouped[key].sort((a, b) => Number(a) - Number(b)).join(", ");
        const totalSections = grouped[key].length;

        resultBox.innerHTML += 
          ✅ <strong>${query}</strong><br>
          ➔ Aisle: <b>${aisle}</b> | Level: ${level} | Block: ${block} | Side: ${side} | Sections: ${sections} (Total: ${totalSections})<br><br>
        ;
      }
    } else {
      resultBox.innerHTML += ⚠️ <strong>${query}</strong> - Item not found<br><br>;
    }
  });
}

searchBox.addEventListener("input", () => {
  const value = searchBox.value.trim();
  clearBtn.style.display = value.length > 0 ? "inline" : "none";

  if (value.length > 0) {
    searchItems();
  } else {
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

// Feedback Form Submission (no changes)
document.getElementById("feedbackForm").addEventListener("submit", function(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  fetch(form.action, {
    method: "POST",
    body: formData,
    headers: { 'Accept': 'application/json' }
  }).then(response => {
    if (response.ok) {
      form.style.display = "none";
      document.getElementById("thankYouMessage").style.display = "block";
    } else {
      alert("⚠️ There was an error submitting your feedback. Please try again.");
    }
  }).catch(error => {
    alert("⚠️ Network error. Please check your connection.");
  });
});

drawSections();
