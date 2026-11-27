// Indice expliqué : prochaine déduction à partir de ce que le joueur a déjà posé.
// Renvoie { kind: "fix" | "cross" | "place", cells, focus, text }.
//   fix   : retirer une croix posée à tort (cells[0])
//   cross : barrer les cases de `cells`
//   place : poser l'envahisseur en cells[0]
// focus = cases qui justifient la déduction (à entourer).
import { CROSS, EMPTY, INVADER, attacks, isSolution, whyAttack, rowOf, colOf } from "./rules.js";
import { combinations } from "./rater.js";

export const ZONE_NAMES = ["jaune", "verte", "violette", "rose", "bleue", "orange", "turquoise", "brune", "anis", "mauve"];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const listFr = a => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " et " + a[a.length - 1]);

export function findHint(P, cells) {
  const n = P.n, N = n * n;
  const cellName = i => `L${rowOf(P, i) + 1}·C${colOf(P, i) + 1}`;
  const zoneName = g => `la zone ${ZONE_NAMES[g]}`;
  const queens = [];
  cells.forEach((s, i) => { if (s === INVADER) queens.push(i); });

  // 0. croix posée sur la case d'un envahisseur
  for (let i = 0; i < N; i++) {
    if (cells[i] === CROSS && isSolution(P, i)) {
      return { kind: "fix", cells: [i], focus: [i],
        text: `La croix en ${cellName(i)} est une erreur : un envahisseur doit aller ici. Je la retire.` };
    }
  }

  // 1. cases vides qu'un envahisseur posé interdit déjà
  const ORDER = ["même ligne", "même colonne", "même zone", "case voisine"];
  for (const q of queens) {
    const hit = [];
    for (let j = 0; j < N; j++) if (cells[j] === EMPTY && attacks(P, q, j)) hit.push(j);
    if (hit.length) {
      const why = ORDER.filter(w => hit.some(j => whyAttack(P, q, j) === w));
      return { kind: "cross", cells: hit, focus: [q],
        text: `L'envahisseur en ${cellName(q)} interdit ${hit.length > 1 ? "ces cases" : "cette case"} (${listFr(why)}). ` +
          "Deux envahisseurs ne partagent ni ligne, ni colonne, ni zone, et ne se touchent pas." };
    }
  }

  // Candidats : cases vides non interdites par un envahisseur posé.
  const cand = new Array(N).fill(false);
  for (let i = 0; i < N; i++) cand[i] = cells[i] === EMPTY && !queens.some(q => attacks(P, q, i));
  const units = [];
  for (let r = 0; r < n; r++) units.push({ type: "row", name: `la ligne ${r + 1}`, cells: [...Array(n).keys()].map(c => r * n + c) });
  for (let c = 0; c < n; c++) units.push({ type: "col", name: `la colonne ${c + 1}`, cells: [...Array(n).keys()].map(r => r * n + c) });
  for (let g = 0; g < n; g++) units.push({ type: "zone", name: zoneName(g), cells: [...Array(N).keys()].filter(i => P.reg[i] === g) });
  const open = units.filter(u => !u.cells.some(i => cells[i] === INVADER));

  // 2. une seule case possible
  for (const u of open) {
    const cs = u.cells.filter(i => cand[i]);
    if (cs.length === 1) {
      return { kind: "place", cells: cs, focus: u.cells,
        text: `${cap(u.name)} n'a plus qu'une case possible : ${cellName(cs[0])}. Son envahisseur va donc ici.` };
    }
  }

  // 3. confinement : k zones dans k lignes/colonnes, ou k lignes/colonnes dans k zones
  const R = i => rowOf(P, i), C = i => colOf(P, i), Z = i => P.reg[i];
  const zones = open.filter(u => u.type === "zone");
  const sets = [
    [zones, R, "lignes", "ligne", r => r + 1],
    [zones, C, "colonnes", "colonne", c => c + 1],
    [open.filter(u => u.type === "row"), Z, "zones", "zone", g => ZONE_NAMES[g]],
    [open.filter(u => u.type === "col"), Z, "zones", "zone", g => ZONE_NAMES[g]],
  ];
  for (let k = 1; k <= 3; k++) {
    for (const [A, key, plur, sing, label] of sets) {
      for (const cb of combinations(A, k)) {
        const inSet = new Set(cb.flatMap(u => u.cells));
        const keys = new Set(cb.flatMap(u => u.cells.filter(i => cand[i]).map(key)));
        if (keys.size !== k) continue;
        const out = [];
        for (let j = 0; j < N; j++) if (cand[j] && keys.has(key(j)) && !inSet.has(j)) out.push(j);
        if (!out.length) continue;
        const ks = [...keys].sort((a, b) => a - b).map(label), names = listFr(cb.map(u => u.name));
        const target = sing === "zone"
          ? (k === 1 ? `la zone ${ks[0]}` : `les zones ${listFr(ks)}`)
          : (k === 1 ? `la ${sing} ${ks[0]}` : `les ${plur} ${listFr(ks)}`);
        const into = sing === "zone" ? "dans" : "sur", back = sing === "zone" ? "sur" : "dans";
        const text = k === 1
          ? `Toutes les cases possibles de ${names} sont ${into} ${target}. L'envahisseur de ${target} sera donc ${back} ${names} : les autres cases de ${target} sont barrées.`
          : `${cap(names)} n'ont de cases possibles que ${into} ${target}. Leurs ${k} envahisseurs occuperont donc ces ${k} ${plur} : les autres cases de ces ${plur} sont barrées.`;
        return { kind: "cross", cells: out, focus: [...inSet], text };
      }
    }
  }

  // 4. raisonnement par l'absurde
  for (let i = 0; i < N; i++) {
    if (!cand[i]) continue;
    for (const u of open) {
      if (u.cells.includes(i)) continue;
      const left = u.cells.filter(j => cand[j]);
      if (left.length && left.every(j => attacks(P, i, j))) {
        return { kind: "cross", cells: [i], focus: left,
          text: `Un envahisseur en ${cellName(i)} interdirait toutes les cases encore possibles de ${u.name} (${listFr(left.map(cellName))}). ${cap(u.name)} resterait vide : cette case est barrée.` };
      }
    }
  }

  // 5. secours : donner un envahisseur
  const r = [...Array(n).keys()].find(r => cells[r * n + P.sol[r]] !== INVADER);
  const i = r * n + P.sol[r];
  return { kind: "place", cells: [i], focus: P.reg.map((g, j) => (g === P.reg[i] ? j : -1)).filter(j => j >= 0),
    text: `Pas de déduction simple à partir de la grille actuelle. Voici l'envahisseur de ${zoneName(P.reg[i])} : ${cellName(i)}.` };
}
