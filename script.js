<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Warehouse Article Locator</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      text-align: center;
      margin: 0;
      padding: 20px;
      background: #f0f2f5;
    }
    h1 {
      margin-bottom: 10px;
    }
    #searchBox {
      padding: 10px;
      font-size: 16px;
      width: 250px;
      margin-bottom: 10px;
      border: 1px solid #aaa;
      border-radius: 5px;
    }
    #clearBtn {
      padding: 10px 14px;
      margin-left: 5px;
      font-size: 16px;
      cursor: pointer;
      border: none;
      background-color: #ff4d4d;
      color: white;
      border-radius: 5px;
      display: none;
    }
    #result {
      margin-top: 15px;
      font-size: 15px;
    }
    svg {
      margin-top: 20px;
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
    }
    .section {
      fill: white;
      stroke: red;
      stroke-width: 1;
    }
    .highlight {
      fill: yellow;
      stroke: black;
      stroke-width: 2;
    }
    .aisle-label {
      font-size: 14px;
      font-weight: bold;
    }
  </style>
</head>
<body>

  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Seal_of_National_Park_Service.svg/1200px-Seal_of_National_Park_Service.svg.png" alt="Logo" width="100">
  <h1>Warehouse Article Locator</h1>

  <input type="text" id="searchBox" placeholder="Enter Item Code">
  <button id="clearBtn">❌</button>

  <div id="result"></div>

  <div class="map-wrapper">
    <svg id="aisles" width="600" height="550"></svg>
  </div>

  <script>
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
  </script>

</body>
</html>
