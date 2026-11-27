import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyStats, newRun, recordWin, summary, currentStreak, formatTime, HISTORY } from "../js/stats.js";

const win = (s, day, over = {}) => recordWin(s, { level: 1, n: 5, perfect: true, run: { ...newRun(), ms: 60000, ...over } }, day);

test("série : jours consécutifs, plusieurs grilles le même jour comptent pour un", () => {
  let s = emptyStats();
  s = win(s, "2026-11-01");
  s = win(s, "2026-11-01");
  assert.equal(s.streak.current, 1);
  s = win(s, "2026-11-02");
  s = win(s, "2026-11-03");
  assert.equal(s.streak.current, 3);
  assert.equal(s.streak.best, 3);
});

test("série : un jour sauté la remet à 1, le record reste", () => {
  let s = emptyStats();
  for (const d of ["2026-11-28", "2026-11-29", "2026-11-30", "2026-12-01"]) s = win(s, d); // passage de mois
  assert.equal(s.streak.current, 4);
  s = win(s, "2026-12-03");
  assert.equal(s.streak.current, 1);
  assert.equal(s.streak.best, 4);
});

test("série affichée : 0 si rien réussi hier ni aujourd'hui", () => {
  const s = win(emptyStats(), "2026-11-01");
  assert.equal(currentStreak(s, "2026-11-02"), 1);
  assert.equal(currentStreak(s, "2026-11-03"), 0);
});

test("moyennes : essais, indices, part sans faute, temps par taille", () => {
  let s = emptyStats();
  s = win(s, "2026-11-01", { attempts: 1, hints: 0, ms: 30000 });
  s = recordWin(s, { level: 2, n: 5, perfect: false, run: { ...newRun(), attempts: 3, hints: 2, hintsLearning: 2, errors: 4, ms: 90000 } }, "2026-11-01");
  s = recordWin(s, { level: 6, n: 6, perfect: true, run: { ...newRun(), ms: 120000 } }, "2026-11-01");
  const m = summary(s, "2026-11-01");
  assert.equal(m.solved, 3);
  assert.equal(m.avgAttempts, 5 / 3);
  assert.equal(m.avgHints, 2 / 3);
  assert.equal(m.hintsLearning, 2);
  assert.equal(m.perfectRate, 2 / 3);
  assert.deepEqual(m.times[0], { n: 5, avg: 60000, best: 30000, count: 2 });
  assert.equal(m.times[1].n, 6);
  assert.deepEqual(m.errors, [0, 4, 0]);
});

test("historique limité aux 20 dernières grilles", () => {
  let s = emptyStats();
  for (let k = 0; k < 30; k++) s = win(s, "2026-11-01", { errors: k });
  assert.equal(s.history.length, HISTORY);
  assert.equal(s.history[0].errors, 10);
});

test("sans grille réussie : moyennes vides", () => {
  const m = summary(emptyStats());
  assert.equal(m.avgAttempts, null);
  assert.equal(m.streak, 0);
  assert.deepEqual(m.times, []);
});

test("format du temps", () => {
  assert.equal(formatTime(65000), "1:05");
  assert.equal(formatTime(0), "0:00");
});
