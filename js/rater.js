// Note de difficulté : coût cumulé des déductions qu'un joueur doit faire.
//   1   une ligne, colonne ou zone n'a plus qu'une case possible
//   2-4 k zones confinées dans k lignes/colonnes (ou l'inverse), k = 1..3
//   6   poser ici viderait une ligne, colonne ou zone (raisonnement par l'absurde)
// Infinity si ces déductions ne suffisent pas (il faudrait essayer au hasard).

export function rate(n, reg) {
  const N = n * n, cand = new Array(N).fill(true), q = new Array(N).fill(false);
  let cost = 0, placed = 0;
  const units = [];
  for (let r = 0; r < n; r++) units.push([...Array(n).keys()].map(c => r * n + c));
  for (let c = 0; c < n; c++) units.push([...Array(n).keys()].map(r => r * n + c));
  for (let g = 0; g < n; g++) units.push([...Array(N).keys()].filter(i => reg[i] === g));
  const R = i => (i / n) | 0, C = i => i % n;

  const elimsOf = i => {
    const out = [];
    for (let j = 0; j < N; j++) {
      if (j === i || !cand[j]) continue;
      if (R(j) === R(i) || C(j) === C(i) || reg[j] === reg[i] ||
          (Math.abs(R(j) - R(i)) <= 1 && Math.abs(C(j) - C(i)) <= 1)) out.push(j);
    }
    return out;
  };
  const place = i => { q[i] = true; cand[i] = false; placed++; elimsOf(i).forEach(j => (cand[j] = false)); };
  const solved = u => u.some(i => q[i]);

  while (placed < n) {
    let did = false;

    for (const u of units) {
      if (solved(u)) continue;
      const cs = u.filter(i => cand[i]);
      if (cs.length === 0) return Infinity;
      if (cs.length === 1) { place(cs[0]); cost += 1; did = true; break; }
    }
    if (did) continue;

    const open = t => units.slice(t * n, (t + 1) * n).filter(u => !solved(u));
    // [ensemble, clé] : zones→lignes, zones→colonnes, lignes→zones, colonnes→zones
    const groups = [[2, 0], [2, 1], [0, 2], [1, 2]];
    outer: for (let k = 1; k <= 3; k++) {
      for (const [a, b] of groups) {
        const A = open(a);
        const key = i => (b === 0 ? R(i) : b === 1 ? C(i) : reg[i]);
        for (const cb of combinations(A, k)) {
          const inSet = new Set(cb.flat());
          const keys = new Set(cb.flat().filter(i => cand[i]).map(key));
          if (keys.size !== k) continue;
          let e = 0;
          for (let j = 0; j < N; j++) if (cand[j] && keys.has(key(j)) && !inSet.has(j)) { cand[j] = false; e++; }
          if (e) { cost += 1 + k; did = true; break outer; }
        }
      }
    }
    if (did) continue;

    for (let i = 0; i < N && !did; i++) {
      if (!cand[i]) continue;
      const el = new Set(elimsOf(i)); el.add(i);
      for (const u of units) {
        if (solved(u) || u.includes(i)) continue;
        if (u.every(j => !cand[j] || el.has(j))) { cand[i] = false; cost += 6; did = true; break; }
      }
    }
    if (did) continue;

    return Infinity;
  }
  return cost;
}

export function combinations(arr, k) {
  const out = [];
  (function rec(s, acc) {
    if (acc.length === k) { out.push(acc.slice()); return; }
    for (let x = s; x < arr.length; x++) { acc.push(arr[x]); rec(x + 1, acc); acc.pop(); }
  })(0, []);
  return out;
}
