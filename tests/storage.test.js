import { test } from "node:test";
import assert from "node:assert/strict";
import { loadState as load, saveState as save, migrate, defaultState, SCHEMA } from "../js/storage.js";

const memory = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };

test("sans sauvegarde : état de départ", () => {
  assert.deepEqual(load(memory()), defaultState());
});

test("sauvegarde puis relecture", () => {
  const st = memory(), s = defaultState();
  s.level = 12; s.maxLevel = 14; s.bonus.radar = 2;
  save(s, st);
  assert.deepEqual(load(st), s);
});

test("données abîmées ou incomplètes : on repart proprement", () => {
  const st = memory();
  st.setItem("invadoku", "{pas du json");
  assert.deepEqual(load(st), defaultState());
  const m = migrate({ level: 7, bonus: { radar: 1 } });
  assert.equal(m.schema, SCHEMA);
  assert.equal(m.maxLevel, 7);
  assert.deepEqual(m.bonus, { radar: 1, hint: 6 });
});

test("stockage indisponible : pas d'erreur", () => {
  const broken = { getItem() { throw new Error("bloqué"); }, setItem() { throw new Error("bloqué"); } };
  assert.deepEqual(load(broken), defaultState());
  assert.doesNotThrow(() => save(defaultState(), broken));
});
