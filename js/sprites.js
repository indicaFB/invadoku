// Sprites pixel art, dessinés en SVG (un <rect> par pixel).
export const INVADER_PIXELS = ["...XXX...", ".XXXXXXX.", "XXXXXXXXX", "XX.XXX.XX", "XXXXXXXXX", "..X.X.X..", ".X.X.X.X.", "X.X...X.X"];
const CROSS_PIXELS = ["XX.....XX", "XXX...XXX", ".XXX.XXX.", "..XXXXX..", "...XXX...", "..XXXXX..", ".XXX.XXX.", "XXX...XXX", "XX.....XX"];
const HEART_PIXELS = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
const ICONS = {
  menu: ["XXXXXXX", ".......", "XXXXXXX", ".......", "XXXXXXX"],
  info: [".XXXXX.", "XX.X.XX", "XXXXXXX", "XX..XXX", "XXX.XXX", "XXX.XXX", ".XXXXX."],
  gear: ["..X.X..", ".XXXXX.", "XXX.XXX", "XX...XX", "XXX.XXX", ".XXXXX.", "..X.X.."],
  chart: ["......X", "....X.X", "..X.X.X", "X.X.X.X", "X.X.X.X", "XXXXXXX"],
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

// Jauge de difficulté : 3 barres pixel, `tier`+1 allumées, couleur selon le palier.
export const DIFF_COLORS = ["#5FD068", "#FFA53D", "#FF5A6E"];
export function difficultySVG(tier) {
  const bars = [[0, 3], [3, 5], [6, 7]]; // [x, hauteur] dans une grille 8×7
  const r = bars.map(([x, h], k) =>
    `<rect x="${x}" y="${7 - h}" width="2" height="${h}" fill="${k <= tier ? DIFF_COLORS[tier] : "var(--line)"}"/>`).join("");
  return `<svg viewBox="0 0 8 7" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}

// Remplace chaque <span data-pix="nom"> par son icône.
export function hydrateIcons(root = document) {
  root.querySelectorAll("[data-pix]").forEach(el => { el.outerHTML = iconSVG(el.dataset.pix); });
}
