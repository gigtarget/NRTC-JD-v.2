function drawSections() {
  svg.innerHTML = "";
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

    // TOP Before Walkway
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

    // TOP After Walkway
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

    // BOTTOM Before Walkway
    for (let i = 0; i < front; i++) {
      ["Left", "Right"].forEach((side, sIndex) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x + sIndex * (sectionSize + padding) + 120); // Push right for bottom
        rect.setAttribute("y", 30 + i * (sectionSize + padding));
        rect.setAttribute("width", sectionSize);
        rect.setAttribute("height", sectionSize);
        rect.setAttribute("class", "section");
        rect.setAttribute("id", `${aisle}-Bottom-BeforeWalkway-${side}-${i + 1}`);
        svg.appendChild(rect);
      });
    }

    // BOTTOM After Walkway
    for (let i = 0; i < back; i++) {
      ["Left", "Right"].forEach((side, sIndex) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x + sIndex * (sectionSize + padding) + 120); // Push right for bottom
        rect.setAttribute("y", 220 + i * (sectionSize + padding));
        rect.setAttribute("width", sectionSize);
        rect.setAttribute("height", sectionSize);
        rect.setAttribute("class", "section");
        rect.setAttribute("id", `${aisle}-Bottom-AfterWalkway-${side}-${i + 1}`);
        svg.appendChild(rect);
      });
    }

    index++;
  }
}
