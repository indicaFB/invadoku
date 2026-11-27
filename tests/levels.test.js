import { test } from "node:test";
import assert from "node:assert/strict";
import { puzzleFor, bandFor, targetScore, BANDS } from "../js/levels.js";

test("les tranches couvrent tous les niveaux sans trou", () => {
  for (let i = 1; i < BANDS.length; i++) assert.equal(BANDS[i].from, BANDS[i - 1].to + 1);
  assert.equal(bandFor(1).n, 5);
  assert.equal(bandFor(500).n, 9);
});

test("chaque niveau a une grille fixe, de la bonne taille, résoluble par déduction", () => {
  for (const l of [1, 5, 6, 15, 16, 35, 36, 70, 71]) {
    const p = puzzleFor(l);
    assert.equal(p.n, bandFor(l).n);
    assert.ok(Number.isFinite(p.score));
  }
});

test("la difficulté monte dans chaque tranche", () => {
  for (const b of BANDS.slice(0, 4)) {
    const third = Math.max(1, Math.floor((b.to - b.from + 1) / 3));
    const avg = ls => ls.reduce((s, l) => s + puzzleFor(l).score, 0) / ls.length;
    const first = avg([...Array(third).keys()].map(k => b.from + k));
    const last = avg([...Array(third).keys()].map(k => b.to - k));
    assert.ok(last > first, `tranche ${b.n}×${b.n} : ${first.toFixed(1)} → ${last.toFixed(1)}`);
    assert.ok(targetScore(b.to) > targetScore(b.from));
  }
});

// Valeurs de la version artifact : garantit que le découpage en modules n'a pas changé les grilles.
test("mêmes grilles que la version précédente", () => {
  const expected = { 1: 5, 2: 9, 3: 13, 4: 17, 5: 21, 6: 8, 10: 22, 20: 23, 36: 16, 71: 21 };
  for (const [l, score] of Object.entries(expected)) assert.equal(puzzleFor(+l).score, score, `niveau ${l}`);
});
