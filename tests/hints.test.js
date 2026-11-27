import { test } from "node:test";
import assert from "node:assert/strict";
import { puzzleFor } from "../js/levels.js";
import { findHint } from "../js/hints.js";
import { EMPTY, CROSS, INVADER, isSolution, isComplete } from "../js/rules.js";

// Applique les indices comme le fait l'interface, jusqu'à la fin de la grille.
function solveWithHints(P, cells) {
  const texts = [];
  for (let k = 0; k < 200 && !isComplete(P, cells); k++) {
    const h = findHint(P, cells);
    texts.push(h.text);
    if (h.kind === "fix") cells[h.cells[0]] = EMPTY;
    else if (h.kind === "cross") {
      for (const i of h.cells) { assert.ok(!isSolution(P, i), `l'indice ne barre jamais la bonne case : ${h.text}`); cells[i] = CROSS; }
    } else {
      assert.ok(isSolution(P, h.cells[0]), `l'indice pose sur la bonne case : ${h.text}`);
      cells[h.cells[0]] = INVADER;
    }
  }
  return texts;
}

for (const level of [1, 8, 20, 45, 90]) {
  test(`niveau ${level} : les indices seuls mènent au bout, sans recours au secours`, () => {
    const P = puzzleFor(level), cells = new Array(P.n * P.n).fill(EMPTY);
    const texts = solveWithHints(P, cells);
    assert.ok(isComplete(P, cells));
    assert.ok(!texts.some(t => t.startsWith("Pas de déduction")), "aucun indice de secours");
    assert.ok(texts.every(t => t.length > 20), "chaque indice a une explication");
  });
}

test("une croix posée sur la bonne case est signalée en premier", () => {
  const P = puzzleFor(3), cells = new Array(P.n * P.n).fill(EMPTY);
  const good = P.sol[0];
  cells[good] = CROSS;
  const h = findHint(P, cells);
  assert.equal(h.kind, "fix");
  assert.equal(h.cells[0], good);
});
