// Sprites pixel art, dessinés en SVG (un <rect> par pixel).
export const INVADER = ["...XXX...", ".XXXXXXX.", "XXXXXXXXX", "XX.XXX.XX", "XXXXXXXXX", "..X.X.X..", ".X.X.X.X.", "X.X...X.X"];
const CROSS = ["XX.....XX", "XXX...XXX", ".XXX.XXX.", "..XXXXX..", "...XXX...", "..XXXXX..", ".XXX.XXX.", "XXX...XXX", "XX.....XX"];
const HEART = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
const ICONS = {
  menu: ["XXXXXXX", ".......", "XXXXXXX", ".......", "XXXXXXX"],
  info: [".XXXXX.", "XX.X.XX", "XXXXXXX", "XX..XXX", "XXX.XXX", "XXX.XXX", ".XXXXX."],
  gear: ["..X.X..", ".XXXXX.", "XXX.XXX", "XX...XX", "XXX.XXX", ".XXXXX.", "..X.X.."],
  radar: ["..XXXX......", ".X....X.....", "X..X...X....", "X.X....X....", "X......X....", "X......X....", ".X....X.....", "..XXXXXX....", ".......XX...", "........XX..", ".........XX.", "..........XX"],
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

export const INVADER_SVG = pixelSVG(INVADER);
export const CROSS_SVG = pixelSVG(CROSS, { cls: "x" });
export const HEART_SVG = pixelSVG(HEART, { fill: "var(--danger)" });
export const iconSVG = name => pixelSVG(ICONS[name]);

// Remplace chaque <span data-pix="nom"> par son icône.
export function hydrateIcons(root = document) {
  root.querySelectorAll("[data-pix]").forEach(el => { el.outerHTML = iconSVG(el.dataset.pix); });
}
