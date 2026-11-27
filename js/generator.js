// Génération de grilles à solution unique.
// Grille n×n, cases numérotées i = ligne*n + colonne.
// reg[i] = numéro de zone (0..n-1), sol[r] = colonne de l'envahisseur de la ligne r.

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(a, R) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Place n envahisseurs : un par ligne et par colonne, jamais voisins.
function placeInvaders(n, R) {
  const q = [], used = new Array(n).fill(false);
  function bt(r) {
    if (r === n) return true;
    for (const c of shuffle([...Array(n).keys()], R)) {
      if (used[c] || (r > 0 && Math.abs(q[r - 1] - c) < 2)) continue;
      used[c] = true; q[r] = c;
      if (bt(r + 1)) return true;
      used[c] = false;
    }
    return false;
  }
  return bt(0) ? q.slice() : null;
}

// Fait pousser une zone autour de chaque envahisseur, case par case au hasard.
function growZones(n, q, R) {
  const reg = new Array(n * n).fill(-1);
  for (let r = 0; r < n; r++) reg[r * n + q[r]] = r;
  let left = n * n - n;
  while (left > 0) {
    const cand = [];
    for (let i = 0; i < n * n; i++) {
      if (reg[i] !== -1) continue;
      const r = (i / n) | 0, c = i % n;
      for (const [dr, dc] of D4) {
        const rr = r + dr, cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
        const g = reg[rr * n + cc];
        if (g !== -1) cand.push([i, g]);
      }
    }
    const [i, g] = cand[Math.floor(R() * cand.length)];
    reg[i] = g; left--;
  }
  return reg;
}

// Renvoie jusqu'à `limit` solutions (tableaux de colonnes par ligne).
export function solve(n, reg, limit = 2) {
  const sols = [], cur = [];
  let colM = 0, regM = 0;
  function bt(r) {
    if (sols.length >= limit) return;
    if (r === n) { sols.push(cur.slice()); return; }
    for (let c = 0; c < n; c++) {
      const g = reg[r * n + c];
      if ((colM >> c) & 1 || (regM >> g) & 1) continue;
      if (r > 0 && Math.abs(cur[r - 1] - c) < 2) continue;
      colM |= 1 << c; regM |= 1 << g; cur[r] = c;
      bt(r + 1);
      colM &= ~(1 << c); regM &= ~(1 << g);
    }
  }
  bt(0);
  return sols;
}

// La zone g reste-t-elle d'un seul tenant si on lui retire la case skip ?
export function isConnected(n, reg, g, skip = -1) {
  const cells = [];
  for (let i = 0; i < n * n; i++) if (reg[i] === g && i !== skip) cells.push(i);
  if (!cells.length) return false;
  const seen = new Set([cells[0]]), st = [cells[0]];
  while (st.length) {
    const i = st.pop(), r = (i / n) | 0, c = i % n;
    for (const [dr, dc] of D4) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= n || cc >= n) continue;
      const j = rr * n + cc;
      if (j !== skip && reg[j] === g && !seen.has(j)) { seen.add(j); st.push(j); }
    }
  }
  return seen.size === cells.length;
}

// Tant qu'une 2e solution existe, on déplace une de ses cases vers une zone voisine pour la casser.
export function generate(n, seed) {
  const R = mulberry32(seed);
  for (let attempt = 0; attempt < 200; attempt++) {
    const q = placeInvaders(n, R);
    const reg = growZones(n, q, R);
    for (let it = 0; it < 400; it++) {
      const sols = solve(n, reg, 2);
      if (sols.length === 1) return { n, reg, sol: q };
      const alt = sols.find(s => s.some((c, r) => c !== q[r]));
      const cells = [];
      alt.forEach((c, r) => { if (c !== q[r]) cells.push(r * n + c); });
      shuffle(cells, R);
      let moved = false;
      for (const i of cells) {
        const r = (i / n) | 0, c = i % n, g = reg[i];
        const nb = shuffle(
          D4.map(([dr, dc]) => [r + dr, c + dc])
            .filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n)
            .map(([a, b]) => reg[a * n + b])
            .filter(x => x !== g),
          R,
        );
        if (!nb.length || !isConnected(n, reg, g, i)) continue;
        reg[i] = nb[0]; moved = true; break;
      }
      if (!moved) break;
    }
  }
  return null;
}
