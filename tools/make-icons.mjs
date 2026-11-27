// Génère les icônes PNG de l'app (sans dépendance) : node tools/make-icons.mjs
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { INVADER_PIXELS as INVADER } from "../js/sprites.js";

const BG = [0x0e, 0x11, 0x24], FG = [0x9d, 0x93, 0xff], SHADOW = [0x2b, 0x30, 0x58];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (const b of buf) {
    c = (crc ^ b) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) raw.set(pixel(x, y), y * (size * 3 + 1) + 1 + x * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

// L'envahisseur occupe `ratio` de la largeur (plus petit pour l'icône « maskable », rognée en cercle).
function icon(size, ratio) {
  const cols = INVADER[0].length, rows = INVADER.length;
  const px = Math.floor((size * ratio) / cols);
  const ox = Math.floor((size - px * cols) / 2), oy = Math.floor((size - px * rows) / 2);
  const off = Math.max(1, Math.round(px / 4));
  const at = (x, y) => {
    const c = Math.floor((x - ox) / px), r = Math.floor((y - oy) / px);
    return x >= ox && y >= oy && r < rows && c < cols && INVADER[r][c] === "X";
  };
  return png(size, (x, y) => (at(x, y) ? FG : at(x - off, y - off) ? SHADOW : BG));
}

const out = new URL("../icons/", import.meta.url);
writeFileSync(new URL("icon-192.png", out), icon(192, 0.62));
writeFileSync(new URL("icon-512.png", out), icon(512, 0.62));
writeFileSync(new URL("maskable-512.png", out), icon(512, 0.46));
writeFileSync(new URL("apple-touch-icon.png", out), icon(180, 0.62));
console.log("Icônes générées dans icons/");
