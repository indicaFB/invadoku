import { test } from "node:test";
import assert from "node:assert/strict";
import { STRING_KEYS, t, setLang, getLang } from "../js/i18n.js";

test("français et anglais ont exactement les mêmes clés", () => {
  assert.deepEqual([...STRING_KEYS.en].sort(), [...STRING_KEYS.fr].sort());
});

test("t() remplace les paramètres et suit la langue choisie", () => {
  setLang("en");
  assert.equal(getLang(), "en");
  assert.equal(t("win.title", { n: 4 }), "Level 4 complete");
  setLang("fr");
  assert.equal(t("win.title", { n: 4 }), "Niveau 4 réussi");
  setLang("xx");
  assert.equal(getLang(), "fr", "langue inconnue : français");
});
