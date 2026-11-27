// Sprites pixel art, dessinés en SVG (un <rect> par pixel).
export const INVADER_PIXELS = ["...XXX...", ".XXXXXXX.", "XXXXXXXXX", "XX.XXX.XX", "XXXXXXXXX", "..X.X.X..", ".X.X.X.X.", "X.X...X.X"];
const CROSS_PIXELS = ["XX.....XX", "XXX...XXX", ".XXX.XXX.", "..XXXXX..", "...XXX...", "..XXXXX..", ".XXX.XXX.", "XXX...XXX", "XX.....XX"];
const HEART_PIXELS = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
const ICONS = {
  menu: ["XXXXXXX", ".......", "XXXXXXX", ".......", "XXXXXXX"],
  info: [".XXXXX.", "XX.X.XX", "XXXXXXX", "XX..XXX", "XXX.XXX", "XXX.XXX", ".XXXXX."],
  gear: ["..X.X..", ".XXXXX.", "XXX.XXX", "XX...XX", "XXX.XXX", ".XXXXX.", "..X.X.."],
  learn: ["XXX.XXX", "X.XXX.X", "X..X..X", "X..X..X", "X..X..X", "XXXXXXX"],
  bulb: ["...XXXX...", "..X....X..", ".X..X...X.", ".X.X....X.", ".X......X.", "..X....X..", "...X..X...", "...XXXX...", "..........", "...XXXX...", "....XX...."],
};

// Dessin centré dans un carré côté = max(largeur, hauteur).
function pixelSVG(rows, { cls = "", fill = "currentColor" } = {}) {
  const w = rows[0].length, h = rows.length, m = Math.max(w, h);
  let r = "";
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === "X") r += `<rect x="${x + (m - w) / 2}" y="${y + (m - h) / 2}" width="1.02" height="1.02"/>`;
  }));
  return `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 ${m} ${m}" fill="${fill}" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}

export const INVADER_SVG = pixelSVG(INVADER_PIXELS);
export const CROSS_SVG = pixelSVG(CROSS_PIXELS, { cls: "x" });
export const HEART_SVG = pixelSVG(HEART_PIXELS, { fill: "var(--danger)" });
export const iconSVG = name => pixelSVG(ICONS[name]);

// Remplace chaque <span data-pix="nom"> par son icône.
export function hydrateIcons(root = document) {
  root.querySelectorAll("[data-pix]").forEach(el => { el.outerHTML = iconSVG(el.dataset.pix); });
}
