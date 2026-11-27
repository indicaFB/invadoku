// Indice expliqué : prochaine déduction à partir de ce que le joueur a déjà posé.
// L'indice se lit en deux temps :
//   look  : où regarder, pour chercher seul
//   steps : le raisonnement pas à pas (ce qui est exclu et pourquoi, la conséquence, l'action)
//   tip   : la règle à retenir, réutilisable sur d'autres grilles
// Renvoie { kind, technique, cells, focus, look, steps, tip, text }.
//   kind "fix"   : retirer la croix en cells[0]
//   kind "cross" : barrer les cases de `cells`
//   kind "place" : poser l'envahisseur en cells[0]
//   focus : cases à entourer (la ligne, colonne ou zone à regarder)
import { CROSS, LOCKED, EMPTY, INVADER, attacks, isSolution, whyAttack, rowOf, colOf } from "./rules.js";
import { combinations } from "./rater.js";

export const ZONE_NAMES = ["jaune", "verte", "violette", "rose", "bleue", "orange", "turquoise", "brune", "anis", "mauve"];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const listFr = a => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " et " + a[a.length - 1]);

export function findHint(P, cells) {
  const n = P.n, N = n * n;
  const R = i => rowOf(P, i), C = i => colOf(P, i), Z = i => P.reg[i];
  const name = i => `L${R(i) + 1}·C${C(i) + 1}`;
  const zone = g => `la zone ${ZONE_NAMES[g]}`;
  // Liste de cases ; « L6·C1 à L6·C4 » quand elles se suivent sur une ligne ou une colonne.
  const cellList = list => {
    const a = [...list].sort((x, y) => x - y);
    if (a.length >= 3) {
      const sameRow = a.every(i => R(i) === R(a[0])) && a.every((i, k) => k === 0 || i === a[k - 1] + 1);
      const sameCol = a.every(i => C(i) === C(a[0])) && a.every((i, k) => k === 0 || i === a[k - 1] + n);
      if (sameRow || sameCol) return `${name(a[0])} à ${name(a[a.length - 1])}`;
    }
    return listFr(a.map(name));
  };
  const queens = [];
  cells.forEach((s, i) => { if (s === INVADER) queens.push(i); });

  // Pourquoi une case n'est plus possible : regroupé par raison, en une phrase.
  const reasonOf = j => {
    if (cells[j] === CROSS || cells[j] === LOCKED) return "barrée";
    const q = queens.find(q => attacks(P, q, j));
    const w = whyAttack(P, q, j);
    return w === "case voisine" ? `touche l'envahisseur en ${name(q)}` : `${w} que l'envahisseur en ${name(q)}`;
  };
  const explainExcluded = list => {
    const groups = new Map();
    for (const j of list) { const r = reasonOf(j); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(j); }
    return [...groups].map(([r, js]) => {
      const many = js.length > 1;
      if (r === "barrée") return `${cellList(js)} ${many ? "sont déjà barrées" : "est déjà barrée"}`;
      return `${cellList(js)} ${many ? r.replace(/^touche/, "touchent").replace(/^même/, "sont sur la même") : r.replace(/^même/, "est sur la même")}`;
    }).join(" ; ");
  };
  const done = h => ({ ...h, text: [h.look, ...h.steps, h.tip].join(" ") });

  // 0. croix posée sur la case d'un envahisseur
  for (let i = 0; i < N; i++) {
    if (cells[i] === CROSS && isSolution(P, i)) {
      return done({ kind: "fix", technique: "Croix à retirer", cells: [i], focus: [i],
        look: `Regarde la croix en ${name(i)}.`,
        steps: [`Cette case doit recevoir un envahisseur : la croix est une erreur.`, `Elle est retirée.`],
        tip: "Ne barre une case que si une règle l'interdit : une croix posée au hasard peut bloquer toute la grille." });
    }
  }

  // 1. cases vides qu'un envahisseur posé interdit déjà
  for (const q of queens) {
    const hit = [];
    for (let j = 0; j < N; j++) if (cells[j] === EMPTY && attacks(P, q, j)) hit.push(j);
    if (!hit.length) continue;
    const parts = [];
    const by = w => hit.filter(j => whyAttack(P, q, j) === w);
    if (by("même ligne").length) parts.push(`la ligne ${R(q) + 1} (${cellList(by("même ligne"))})`);
    if (by("même colonne").length) parts.push(`la colonne ${C(q) + 1} (${cellList(by("même colonne"))})`);
    if (by("même zone").length) parts.push(`${zone(Z(q))} (${cellList(by("même zone"))})`);
    if (by("case voisine").length) parts.push(`les cases qui le touchent (${cellList(by("case voisine"))})`);
    return done({ kind: "cross", technique: "Ce qu'interdit un envahisseur", cells: hit, focus: [q],
      look: `Regarde l'envahisseur en ${name(q)}.`,
      steps: [
        "Un envahisseur interdit toute sa ligne, toute sa colonne, toute sa zone et les 8 cases autour de lui.",
        `Il reste des cases vides dans ${listFr(parts)}.`,
        `Elles sont barrées.`,
      ],
      tip: "Après chaque envahisseur posé, barre tout ce qu'il interdit : les déductions suivantes apparaissent." });
  }

  // Candidats : cases vides non interdites par un envahisseur posé.
  const cand = new Array(N).fill(false);
  for (let i = 0; i < N; i++) cand[i] = cells[i] === EMPTY && !queens.some(q => attacks(P, q, i));
  const units = [];
  for (let r = 0; r < n; r++) units.push({ type: "ligne", name: `la ligne ${r + 1}`, cells: [...Array(n).keys()].map(c => r * n + c) });
  for (let c = 0; c < n; c++) units.push({ type: "colonne", name: `la colonne ${c + 1}`, cells: [...Array(n).keys()].map(r => r * n + c) });
  for (let g = 0; g < n; g++) units.push({ type: "zone", name: zone(g), cells: [...Array(N).keys()].filter(i => Z(i) === g) });
  const open = units.filter(u => !u.cells.some(i => cells[i] === INVADER));

  // 2. une seule case possible
  for (const u of open) {
    const cs = u.cells.filter(i => cand[i]);
    if (cs.length !== 1) continue;
    const others = u.cells.filter(i => !cand[i]);
    return done({ kind: "place", technique: "Dernière case libre", cells: cs, focus: u.cells,
      look: `Regarde ${u.name}.`,
      steps: others.length ? [
        `Ses autres cases sont exclues : ${explainExcluded(others)}.`,
        `Il ne reste que ${name(cs[0])}.`,
        `${cap(u.name)} doit avoir un envahisseur : il va donc en ${name(cs[0])}.`,
      ] : [
        `${cap(u.name)} n'a qu'une seule case : ${name(cs[0])}.`,
        `Elle doit avoir un envahisseur : il va donc ici.`,
      ],
      tip: "Cherche les lignes, colonnes ou zones qui n'ont plus qu'une case libre." });
  }

  // 3. confinement : k zones dans k lignes/colonnes, ou k lignes/colonnes dans k zones
  const zones = open.filter(u => u.type === "zone");
  const sets = [
    { A: zones, key: R, kind: "ligne", label: r => r + 1 },
    { A: zones, key: C, kind: "colonne", label: c => c + 1 },
    { A: open.filter(u => u.type === "ligne"), key: Z, kind: "zone", label: g => ZONE_NAMES[g] },
    { A: open.filter(u => u.type === "colonne"), key: Z, kind: "zone", label: g => ZONE_NAMES[g] },
  ];
  for (let k = 1; k <= 3; k++) {
    for (const { A, key, kind, label } of sets) {
      for (const cb of combinations(A, k)) {
        const inSet = new Set(cb.flatMap(u => u.cells));
        const possible = cb.flatMap(u => u.cells.filter(i => cand[i]));
        const keys = new Set(possible.map(key));
        if (keys.size !== k) continue;
        const out = [];
        for (let j = 0; j < N; j++) if (cand[j] && keys.has(key(j)) && !inSet.has(j)) out.push(j);
        if (!out.length) continue;

        const ks = [...keys].sort((a, b) => a - b).map(label);
        const names = listFr(cb.map(u => u.name));
        const target = kind === "zone"
          ? (k === 1 ? `la zone ${ks[0]}` : `les zones ${listFr(ks)}`)
          : (k === 1 ? `la ${kind} ${ks[0]}` : `les ${kind}s ${listFr(ks)}`);
        const into = kind === "zone" ? "dans" : "sur";
        const ofTarget = k === 1 ? `de ${target}` : target.replace(/^les /, "des ");
        const excluded = cb.flatMap(u => u.cells.filter(i => !cand[i] && cells[i] !== INVADER));
        const steps = [];
        if (k === 1) {
          const u = cb[0];
          steps.push(`Ses cases encore possibles (${cellList(possible)}) sont toutes ${into} ${target}` +
            (excluded.length ? ` : ${explainExcluded(excluded)}.` : "."));
          steps.push(`L'envahisseur de ${u.name} sera donc ${into} ${target}.`);
          steps.push(`${cap(target)} n'a qu'un envahisseur : c'est celui de ${u.name}. ` +
            `Ses cases hors de ${u.name} sont donc barrées : ${cellList(out)}.`);
        } else {
          steps.push(`Leurs cases encore possibles sont toutes ${into} ${target}.`);
          steps.push(`Ces ${k} ${cb[0].type}s ont besoin de ${k} envahisseurs, et ${target} n'en ont que ${k} en tout. ` +
            `Les envahisseurs ${ofTarget} sont donc ceux de ${names}.`);
          steps.push(`Les autres cases ${ofTarget} sont barrées : ${cellList(out)}.`);
        }
        const tip = k === 1
          ? (kind === "zone"
            ? "Quand toutes les cases possibles d'une ligne (ou colonne) sont dans une même zone, cette zone lui est réservée : barre le reste de la zone."
            : "Quand toutes les cases possibles d'une zone sont alignées, cette ligne (ou colonne) lui est réservée : barre le reste de la ligne.")
          : `Si ${k} ${cb[0].type}s tiennent dans ${k} ${kind}s, ces ${kind}s leur sont réservées.`;
        return done({ kind: "cross", technique: k === 1 ? "Ligne ou zone réservée" : `${k} pour ${k}`,
          cells: out, focus: [...inSet], look: `Regarde ${names}.`, steps, tip });
      }
    }
  }

  // 4. raisonnement par l'absurde
  for (let i = 0; i < N; i++) {
    if (!cand[i]) continue;
    for (const u of open) {
      if (u.cells.includes(i)) continue;
      const left = u.cells.filter(j => cand[j]);
      if (!left.length || !left.every(j => attacks(P, i, j))) continue;
      return done({ kind: "cross", technique: "Test d'une case", cells: [i], focus: [i, ...left],
        look: `Regarde la case ${name(i)} et ${u.name}.`,
        steps: [
          `Imagine un envahisseur en ${name(i)}.`,
          `Il interdirait ${cellList(left)} (${listFr([...new Set(left.map(j => whyAttack(P, i, j).replace("case voisine", "cases voisines")))])}) : ce sont les seules cases encore possibles de ${u.name}.`,
          `${cap(u.name)} n'aurait plus d'envahisseur : impossible. ${name(i)} est donc barrée.`,
        ],
        tip: "Teste une case en imaginant un envahisseur dessus : s'il vide une ligne, une colonne ou une zone, la case est interdite." });
    }
  }

  // 5. secours : donner un envahisseur
  const r = [...Array(n).keys()].find(r => cells[r * n + P.sol[r]] !== INVADER);
  const i = r * n + P.sol[r];
  return done({ kind: "place", technique: "Coup de pouce", cells: [i],
    focus: P.reg.map((g, j) => (g === Z(i) ? j : -1)).filter(j => j >= 0),
    look: `Regarde ${zone(Z(i))}.`,
    steps: ["Aucune déduction simple ne se voit à partir de la grille actuelle.", `Voici son envahisseur : ${name(i)}.`],
    tip: "Vérifie tes croix : une croix posée sans règle peut cacher la déduction suivante." });
}
