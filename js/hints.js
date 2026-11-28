// Indice expliqué : prochaine déduction à partir de ce que le joueur a déjà posé.
// L'indice se lit en deux temps :
//   look  : où regarder, pour chercher seul
//   steps : le raisonnement pas à pas (ce qui est exclu et pourquoi, la conséquence, l'action)
//   tip   : la règle à retenir, réutilisable sur d'autres grilles
// findHint(P, cells, lang) renvoie { kind, technique, cells, focus, look, steps, tip, text }.
//   kind "fix"   : retirer la croix en cells[0]
//   kind "cross" : barrer les cases de `cells`
//   kind "place" : poser l'envahisseur en cells[0]
//   focus : cases à entourer (la ligne, colonne ou zone à regarder)
// La logique est commune ; seules les phrases diffèrent selon la langue (packs FR et EN ci-dessous).
import { CROSS, LOCKED, EMPTY, INVADER, attacks, isSolution, whyAttack, rowOf, colOf } from "./rules.js";
import { combinations } from "./rater.js";

export const ZONE_NAMES = {
  fr: ["jaune", "verte", "violette", "rose", "bleue", "orange", "turquoise", "brune", "anis", "mauve"],
  en: ["yellow", "green", "purple", "pink", "blue", "orange", "turquoise", "brown", "lime", "mauve"],
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const joinWith = and => a => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + and + a[a.length - 1]);

// Unité regardée : { type: "row" | "col" | "zone", idx }.
// Raison d'exclusion : { type: "crossed" } ou { type: "row" | "col" | "zone" | "near", q }.
const PACKS = {
  fr: {
    cell: (r, c) => `L${r + 1}·C${c + 1}`,
    list: joinWith(" et "),
    sep: " ; ",
    range: (a, b) => `${a} à ${b}`,
    unit: u => (u.type === "row" ? `la ligne ${u.idx + 1}` : u.type === "col" ? `la colonne ${u.idx + 1}` : `la zone ${ZONE_NAMES.fr[u.idx]}`),
    units: (type, labels, list) => (type === "zone" ? `les zones ${list(labels)}` : `les ${type === "row" ? "lignes" : "colonnes"} ${list(labels)}`),
    ofUnits: s => s.replace(/^les /, "des "),
    plural: { row: "lignes", col: "colonnes", zone: "zones" },
    excluded: (cells, many, why, qn) => {
      if (why === "crossed") return `${cells} ${many ? "sont déjà barrées" : "est déjà barrée"}`;
      if (why === "near") return `${cells} ${many ? "touchent" : "touche"} l'envahisseur en ${qn}`;
      const w = { row: "ligne", col: "colonne", zone: "zone" }[why];
      return `${cells} ${many ? "sont" : "est"} sur la même ${w} que l'envahisseur en ${qn}`;
    },
    why: { row: "même ligne", col: "même colonne", zone: "même zone", near: "cases voisines" },
    fix: n => ({ technique: "Croix à retirer", look: `Regarde la croix en ${n}.`,
      steps: ["Cette case doit recevoir un envahisseur : la croix est une erreur.", "Retire-la."],
      tip: "Ne barre une case que si une règle l'interdit : une croix posée au hasard peut bloquer toute la grille." }),
    sweep: (qn, parts, list) => ({ technique: "Ce qu'interdit un envahisseur", look: `Regarde l'envahisseur en ${qn}.`,
      steps: ["Un envahisseur interdit toute sa ligne, toute sa colonne, toute sa zone et les 8 cases autour de lui.",
        `Il reste des cases vides dans ${list(parts)}.`, "Barre-les."],
      tip: "Après chaque envahisseur posé, barre tout ce qu'il interdit : les déductions suivantes apparaissent." }),
    sweepPart: { row: (i, c) => `la ligne ${i + 1} (${c})`, col: (i, c) => `la colonne ${i + 1} (${c})`,
      zone: (i, c) => `la zone ${ZONE_NAMES.fr[i]} (${c})`, near: (_, c) => `les cases qui le touchent (${c})` },
    single: (un, cn, excl) => ({ technique: "Dernière case libre", look: `Regarde ${un}.`,
      steps: excl
        ? [`Ses autres cases sont exclues : ${excl}.`, `Il ne reste que ${cn}.`, `${cap(un)} doit avoir un envahisseur : il va donc en ${cn}.`]
        : [`${cap(un)} n'a qu'une seule case : ${cn}.`, "Elle doit avoir un envahisseur : il va donc ici."],
      tip: "Cherche les lignes, colonnes ou zones qui n'ont plus qu'une case libre." }),
    reserved1: (un, target, toZone, possible, excl, out) => {
      const into = toZone ? "dans" : "sur";
      return { technique: "Ligne ou zone réservée", look: `Regarde ${un}.`,
        steps: [`Ses cases encore possibles (${possible}) sont toutes ${into} ${target}${excl ? ` : ${excl}.` : "."}`,
          `L'envahisseur de ${un} sera donc ${into} ${target}.`,
          `${cap(target)} n'a qu'un envahisseur : c'est celui de ${un}. Ses cases hors de ${un} peuvent donc être barrées : ${out}.`],
        tip: toZone
          ? "Quand toutes les cases possibles d'une ligne (ou colonne) sont dans une même zone, cette zone lui est réservée : barre le reste de la zone."
          : "Quand toutes les cases possibles d'une zone sont alignées, cette ligne (ou colonne) lui est réservée : barre le reste de la ligne." };
    },
    reservedK: (k, names, srcPlural, target, ofTarget, tgtPlural, toZone, out) => ({
      technique: `${k} pour ${k}`, look: `Regarde ${names}.`,
      steps: [`Leurs cases encore possibles sont toutes ${toZone ? "dans" : "sur"} ${target}.`,
        `Ces ${k} ${srcPlural} ont besoin de ${k} envahisseurs, et ${target} n'en ont que ${k} en tout. Les envahisseurs ${ofTarget} sont donc ceux de ${names}.`,
        `Les autres cases ${ofTarget} peuvent être barrées : ${out}.`],
      tip: `Si ${k} ${srcPlural} tiennent dans ${k} ${tgtPlural}, ces ${tgtPlural} leur sont réservées.` }),
    test: (cn, un, left, why) => ({ technique: "Test d'une case", look: `Regarde la case ${cn} et ${un}.`,
      steps: [`Imagine un envahisseur en ${cn}.`,
        `Il interdirait ${left} (${why}) : ce sont les seules cases encore possibles de ${un}.`,
        `${cap(un)} n'aurait plus d'envahisseur : impossible. ${cn} peut donc être barrée.`],
      tip: "Teste une case en imaginant un envahisseur dessus : s'il vide une ligne, une colonne ou une zone, la case est interdite." }),
    rescue: (un, cn) => ({ technique: "Coup de pouce", look: `Regarde ${un}.`,
      steps: ["Aucune déduction simple ne se voit à partir de la grille actuelle.", `Voici son envahisseur : ${cn}.`],
      tip: "Vérifie tes croix : une croix posée sans règle peut cacher la déduction suivante." }),
  },

  en: {
    cell: (r, c) => `R${r + 1}·C${c + 1}`,
    list: joinWith(" and "),
    sep: "; ",
    range: (a, b) => `${a} to ${b}`,
    unit: u => (u.type === "row" ? `row ${u.idx + 1}` : u.type === "col" ? `column ${u.idx + 1}` : `the ${ZONE_NAMES.en[u.idx]} zone`),
    units: (type, labels, list) => (type === "zone" ? `the ${list(labels)} zones` : `${type === "row" ? "rows" : "columns"} ${list(labels)}`),
    ofUnits: s => s,
    plural: { row: "rows", col: "columns", zone: "zones" },
    excluded: (cells, many, why, qn) => {
      if (why === "crossed") return `${cells} ${many ? "are" : "is"} already crossed out`;
      if (why === "near") return `${cells} ${many ? "touch" : "touches"} the invader at ${qn}`;
      const w = { row: "row", col: "column", zone: "zone" }[why];
      return `${cells} ${many ? "are" : "is"} in the same ${w} as the invader at ${qn}`;
    },
    why: { row: "same row", col: "same column", zone: "same zone", near: "touching" },
    fix: n => ({ technique: "Wrong cross", look: `Look at the cross at ${n}.`,
      steps: ["This cell must hold an invader: the cross is a mistake.", "Remove it."],
      tip: "Only cross out a cell when a rule forbids it: a random cross can block the whole grid." }),
    sweep: (qn, parts, list) => ({ technique: "What an invader forbids", look: `Look at the invader at ${qn}.`,
      steps: ["An invader forbids its whole row, its whole column, its whole zone and the 8 cells around it.",
        `There are still empty cells in ${list(parts)}.`, "Cross them out."],
      tip: "After placing an invader, cross out everything it forbids: the next deductions show up." }),
    sweepPart: { row: (i, c) => `row ${i + 1} (${c})`, col: (i, c) => `column ${i + 1} (${c})`,
      zone: (i, c) => `the ${ZONE_NAMES.en[i]} zone (${c})`, near: (_, c) => `the cells touching it (${c})` },
    single: (un, cn, excl) => ({ technique: "Last free cell", look: `Look at ${un}.`,
      steps: excl
        ? [`Its other cells are ruled out: ${excl}.`, `Only ${cn} is left.`, `${cap(un)} needs an invader: it goes on ${cn}.`]
        : [`${cap(un)} has a single cell: ${cn}.`, "It needs an invader: it goes here."],
      tip: "Look for rows, columns or zones with only one free cell left." }),
    reserved1: (un, target, toZone, possible, excl, out) => ({
      technique: "Reserved row or zone", look: `Look at ${un}.`,
      steps: [`Its remaining possible cells (${possible}) are all in ${target}${excl ? `: ${excl}.` : "."}`,
        `So the invader of ${un} will be in ${target}.`,
        `${cap(target)} has only one invader, so it belongs to ${un}. Its cells outside ${un} can be crossed out: ${out}.`],
      tip: toZone
        ? "When all the possible cells of a row (or column) lie in one zone, that zone is reserved for it: cross out the rest of the zone."
        : "When all the possible cells of a zone line up, that row (or column) is reserved for it: cross out the rest of the row." }),
    reservedK: (k, names, srcPlural, target, ofTarget, tgtPlural, toZone, out) => ({
      technique: `${k} for ${k}`, look: `Look at ${names}.`,
      steps: [`All their possible cells are in ${target}.`,
        `These ${k} ${srcPlural} need ${k} invaders, and ${target} only hold ${k} in total. So the invaders of ${target} are those of ${names}.`,
        `The other cells of ${target} can be crossed out: ${out}.`],
      tip: `If ${k} ${srcPlural} fit in ${k} ${tgtPlural}, those ${tgtPlural} are reserved for them.` }),
    test: (cn, un, left, why) => ({ technique: "Testing a cell", look: `Look at cell ${cn} and ${un}.`,
      steps: [`Imagine an invader on ${cn}.`,
        `It would forbid ${left} (${why}): the only possible cells left in ${un}.`,
        `${cap(un)} would have no invader: impossible. So ${cn} can be crossed out.`],
      tip: "Test a cell by imagining an invader on it: if it empties a row, a column or a zone, the cell is forbidden." }),
    rescue: (un, cn) => ({ technique: "A little help", look: `Look at ${un}.`,
      steps: ["No simple deduction can be seen from the current grid.", `Here is its invader: ${cn}.`],
      tip: "Check your crosses: a cross placed without a rule can hide the next deduction." }),
  },
};

export function findHint(P, cells, lang = "fr") {
  const L = PACKS[lang] || PACKS.fr;
  const n = P.n, N = n * n;
  const R = i => rowOf(P, i), C = i => colOf(P, i), Z = i => P.reg[i];
  const name = i => L.cell(R(i), C(i));
  // Liste de cases ; « L6·C1 à L6·C4 » quand elles se suivent sur une ligne ou une colonne.
  const cellList = list => {
    const a = [...list].sort((x, y) => x - y);
    if (a.length >= 3) {
      const sameRow = a.every(i => R(i) === R(a[0])) && a.every((i, k) => k === 0 || i === a[k - 1] + 1);
      const sameCol = a.every(i => C(i) === C(a[0])) && a.every((i, k) => k === 0 || i === a[k - 1] + n);
      if (sameRow || sameCol) return L.range(name(a[0]), name(a[a.length - 1]));
    }
    return L.list(a.map(name));
  };
  const queens = [];
  cells.forEach((s, i) => { if (s === INVADER) queens.push(i); });

  // Pourquoi des cases ne sont plus possibles, regroupé par raison, en une phrase.
  const explainExcluded = list => {
    const groups = new Map();
    for (const j of list) {
      let key;
      if (cells[j] === CROSS || cells[j] === LOCKED) key = "crossed|";
      else { const q = queens.find(q => attacks(P, q, j)); key = `${whyAttack(P, q, j)}|${q}`; }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(j);
    }
    return [...groups].map(([key, js]) => {
      const [why, q] = key.split("|");
      return L.excluded(cellList(js), js.length > 1, why, q ? name(+q) : "");
    }).join(L.sep);
  };
  const done = (h, extra) => ({ ...extra, ...h, text: [h.look, ...h.steps, h.tip].join(" ") });

  // 0. croix posée sur la case d'un envahisseur
  for (let i = 0; i < N; i++) {
    if (cells[i] === CROSS && isSolution(P, i)) return done(L.fix(name(i)), { kind: "fix", cells: [i], focus: [i] });
  }

  // 1. cases vides qu'un envahisseur posé interdit déjà
  for (const q of queens) {
    const hit = [];
    for (let j = 0; j < N; j++) if (cells[j] === EMPTY && attacks(P, q, j)) hit.push(j);
    if (!hit.length) continue;
    const idx = { row: R(q), col: C(q), zone: Z(q), near: 0 };
    const parts = ["row", "col", "zone", "near"]
      .map(w => [w, hit.filter(j => whyAttack(P, q, j) === w)])
      .filter(([, js]) => js.length)
      .map(([w, js]) => L.sweepPart[w](idx[w], cellList(js)));
    return done(L.sweep(name(q), parts, L.list), { kind: "cross", cells: hit, focus: [q] });
  }

  // Candidats : cases vides non interdites par un envahisseur posé.
  const cand = new Array(N).fill(false);
  for (let i = 0; i < N; i++) cand[i] = cells[i] === EMPTY && !queens.some(q => attacks(P, q, i));
  const units = [];
  for (let r = 0; r < n; r++) units.push({ type: "row", idx: r, cells: [...Array(n).keys()].map(c => r * n + c) });
  for (let c = 0; c < n; c++) units.push({ type: "col", idx: c, cells: [...Array(n).keys()].map(r => r * n + c) });
  for (let g = 0; g < n; g++) units.push({ type: "zone", idx: g, cells: [...Array(N).keys()].filter(i => Z(i) === g) });
  units.forEach(u => (u.name = L.unit(u)));
  const open = units.filter(u => !u.cells.some(i => cells[i] === INVADER));

  // 2. une seule case possible
  for (const u of open) {
    const cs = u.cells.filter(i => cand[i]);
    if (cs.length !== 1) continue;
    const others = u.cells.filter(i => !cand[i]);
    return done(L.single(u.name, name(cs[0]), others.length ? explainExcluded(others) : ""),
      { kind: "place", cells: cs, focus: u.cells });
  }

  // 3. confinement : k zones dans k lignes/colonnes, ou k lignes/colonnes dans k zones
  const zones = open.filter(u => u.type === "zone");
  const sets = [
    { A: zones, key: R, tgt: "row" },
    { A: zones, key: C, tgt: "col" },
    { A: open.filter(u => u.type === "row"), key: Z, tgt: "zone" },
    { A: open.filter(u => u.type === "col"), key: Z, tgt: "zone" },
  ];
  for (let k = 1; k <= 3; k++) {
    for (const { A, key, tgt } of sets) {
      for (const cb of combinations(A, k)) {
        const inSet = new Set(cb.flatMap(u => u.cells));
        const possible = cb.flatMap(u => u.cells.filter(i => cand[i]));
        const keys = new Set(possible.map(key));
        if (keys.size !== k) continue;
        const out = [];
        for (let j = 0; j < N; j++) if (cand[j] && keys.has(key(j)) && !inSet.has(j)) out.push(j);
        if (!out.length) continue;

        const toZone = tgt === "zone";
        const idxs = [...keys].sort((a, b) => a - b);
        const extra = { kind: "cross", cells: out, focus: [...inSet] };
        if (k === 1) {
          const target = L.unit({ type: tgt, idx: idxs[0] });
          const excluded = cb[0].cells.filter(i => !cand[i] && cells[i] !== INVADER);
          return done(L.reserved1(cb[0].name, target, toZone, cellList(possible),
            excluded.length ? explainExcluded(excluded) : "", cellList(out)), extra);
        }
        const labels = idxs.map(x => (toZone ? ZONE_NAMES[lang in PACKS ? lang : "fr"][x] : x + 1));
        const target = L.units(tgt, labels, L.list);
        return done(L.reservedK(k, L.list(cb.map(u => u.name)), L.plural[cb[0].type], target, L.ofUnits(target),
          L.plural[tgt], toZone, cellList(out)), extra);
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
      const why = L.list([...new Set(left.map(j => L.why[whyAttack(P, i, j)]))]);
      return done(L.test(name(i), u.name, cellList(left), why), { kind: "cross", cells: [i], focus: [i, ...left] });
    }
  }

  // 5. secours : donner un envahisseur
  const r = [...Array(n).keys()].find(r => cells[r * n + P.sol[r]] !== INVADER);
  const i = r * n + P.sol[r];
  return done(L.rescue(L.unit({ type: "zone", idx: Z(i) }), name(i)),
    { kind: "place", cells: [i], focus: P.reg.map((g, j) => (g === Z(i) ? j : -1)).filter(j => j >= 0) });
}
