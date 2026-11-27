import { test } from "node:test";
import assert from "node:assert/strict";
import { generate, solve, isConnected } from "../js/generator.js";

for (const n of [5, 6, 7, 8, 9]) {
  test(`grilles ${n}×${n} : solution unique, règles respectées, zones d'un seul tenant`, () => {
    for (let s = 1; s <= 15; s++) {
      const g = generate(n, s * 977 + n);
      assert.ok(g, "génération réussie");
      const sols = solve(n, g.reg, 2);
      assert.equal(sols.length, 1, "une seule solution");
      assert.deepEqual(sols[0], g.sol, "la solution trouvée est celle du générateur");
      assert.equal(new Set(g.sol).size, n, "une colonne différente par ligne");
      for (let r = 1; r < n; r++) assert.ok(Math.abs(g.sol[r] - g.sol[r - 1]) >= 2, "pas de contact en diagonale");
      const zones = new Set(g.sol.map((c, r) => g.reg[r * n + c]));
      assert.equal(zones.size, n, "un envahisseur par zone");
      for (let z = 0; z < n; z++) assert.ok(isConnected(n, g.reg, z), `zone ${z} d'un seul tenant`);
    }
  });
}

test("même graine, même grille", () => {
  assert.deepEqual(generate(7, 1234), generate(7, 1234));
});
