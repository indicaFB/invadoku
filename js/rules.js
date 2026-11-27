// Règles de base, sans état. P = { n, reg, sol }.
// États de case : 0 vide, 1 croix du joueur, 2 croix verrouillée (erreur), 3 envahisseur.
export const EMPTY = 0, CROSS = 1, LOCKED = 2, INVADER = 3;

export const rowOf = (P, i) => (i / P.n) | 0;
export const colOf = (P, i) => i % P.n;
export const isSolution = (P, i) => P.sol[rowOf(P, i)] === colOf(P, i);

// Deux envahisseurs en a et b seraient-ils en conflit ?
export function attacks(P, a, b) {
  if (a === b) return false;
  const ra = rowOf(P, a), ca = colOf(P, a), rb = rowOf(P, b), cb = colOf(P, b);
  return ra === rb || ca === cb || P.reg[a] === P.reg[b] ||
    (Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1);
}

// Raison du conflit : "row" | "col" | "zone" | "near" (cases voisines).
export function whyAttack(P, q, j) {
  if (rowOf(P, q) === rowOf(P, j)) return "row";
  if (colOf(P, q) === colOf(P, j)) return "col";
  if (P.reg[q] === P.reg[j]) return "zone";
  return "near";
}

export const isComplete = (P, cells) => cells.filter(s => s === INVADER).length === P.n;
