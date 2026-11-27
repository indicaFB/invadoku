// Progression : la taille monte par tranches, et dans chaque tranche le score visé monte.
// Chaque niveau tire 20 grilles (graines fixes) et prend la plus facile qui atteint le score visé.
import { generate } from "./generator.js";
import { rate } from "./rater.js";

export const BANDS = [
  { n: 5, from: 1, to: 5, lo: 5, hi: 20 },
  { n: 6, from: 6, to: 15, lo: 8, hi: 32 },
  { n: 7, from: 16, to: 35, lo: 12, hi: 45 },
  { n: 8, from: 36, to: 70, lo: 16, hi: 55 },
  { n: 9, from: 71, to: 120, lo: 20, hi: 70 },
];
const POOL = 20;

export const bandFor = level => BANDS.filter(b => b.from <= level).pop();

export function targetScore(level) {
  const b = bandFor(level);
  const t = Math.min(1, (level - b.from) / Math.max(1, b.to - b.from));
  return b.lo + (b.hi - b.lo) * t;
}

const cache = new Map();
export function puzzleFor(level) {
  if (cache.has(level)) return cache.get(level);
  const { n } = bandFor(level), pool = [];
  for (let k = 0; k < POOL; k++) {
    let seed = level * 7919 + n * 104729 + k * 15485863, g;
    while (!(g = generate(n, seed))) seed++;
    g.score = rate(n, g.reg);
    if (Number.isFinite(g.score)) pool.push(g);
  }
  pool.sort((a, c) => a.score - c.score);
  const target = targetScore(level);
  const p = pool.find(g => g.score >= target) || pool[pool.length - 1];
  p.level = level;
  cache.set(level, p);
  return p;
}

export const diffLabel = score =>
  score < 15 ? "Facile" : score < 30 ? "Moyen" : score < 55 ? "Difficile" : "Expert";
