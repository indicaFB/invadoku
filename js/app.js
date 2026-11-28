// Interface du jeu : rendu, gestes, bonus, fenêtres, écran d'accueil.
import { puzzleFor, diffTier } from "./levels.js";
import { EMPTY, CROSS, LOCKED, INVADER, isSolution, isComplete, rowOf, colOf } from "./rules.js";
import { findHint } from "./hints.js";
import { INVADER_SVG, CROSS_SVG, HEART_SVG, hydrateIcons, difficultySVG } from "./sprites.js";
import { loadState, saveState, defaultState } from "./storage.js";
import { explode } from "./fx.js";
import { t, tn, fmt, pct, setLang, getLang, detectLang, translatePage } from "./i18n.js";
import { newRun, recordWin, summary, formatTime, currentStreak, HISTORY } from "./stats.js";

const $ = id => document.getElementById(id);
const grid = $("grid");
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

let S = loadState();
let P = null;          // grille courante { n, reg, sol, score, level }
let cellEls = [];
const save = () => { tickTime(); saveState(S); checkFollow(); };

/* ---------- Partie ---------- */
// retry : même grille, nouvel essai (les compteurs de la grille sont conservés).
function newGame({ retry = false } = {}) {
  const run = retry && S.game?.run ? { ...S.game.run, attempts: S.game.run.attempts + 1 } : newRun();
  S.game = { sig: P.reg.join(""), level: S.level, cells: new Array(P.n * P.n).fill(EMPTY), err: [], hearts: 3, run };
  save();
}

// Temps de jeu actif : page visible, écran d'accueil fermé, et un geste il y a moins de 90 s.
const timer = { running: false, last: 0, lastInput: 0 };
function tickTime() {
  const now = Date.now();
  if (timer.running && S.game?.run && now - timer.lastInput < 90000) S.game.run.ms += Math.min(now - timer.last, 90000);
  timer.last = now;
}
function startTimer() { timer.running = true; timer.last = timer.lastInput = Date.now(); }
document.addEventListener("visibilitychange", () => {
  tickTime();
  timer.running = !document.hidden && $("splash").hidden;
  save();
});
document.addEventListener("pointerdown", () => { tickTime(); timer.lastInput = Date.now(); }, true);
setInterval(tickTime, 5000);

function startLevel(level, { animate = true } = {}) {
  clearHint();
  followHint = null;
  S.level = level;
  P = puzzleFor(level);
  if (!S.game || S.game.level !== level || S.game.sig !== P.reg.join("")) newGame();
  S.game.run ||= newRun(); // partie commencée avant les stats
  build();
  render();
  if (animate) reveal();
}

// Construction de la grille : les cases apparaissent en vague diagonale depuis le coin haut gauche.
const REVEAL_STEP = 45, REVEAL_CELL = 420; // ms entre deux diagonales, durée d'une case
let revealTimer;
function reveal() {
  if (reducedMotion()) return;
  cellEls.forEach((d, i) => d.style.setProperty("--d", `${(rowOf(P, i) + colOf(P, i)) * REVEAL_STEP}ms`));
  grid.classList.remove("reveal");
  void grid.offsetWidth; // relance l'animation
  grid.classList.add("reveal");
  clearTimeout(revealTimer);
  revealTimer = setTimeout(() => grid.classList.remove("reveal"), (2 * P.n - 2) * REVEAL_STEP + REVEAL_CELL + 50);
}

/* ---------- Rendu ---------- */
function build() {
  const n = P.n;
  grid.style.gridTemplateColumns = `repeat(${n},minmax(0,1fr))`;
  grid.style.gridTemplateRows = `repeat(${n},minmax(0,1fr))`;
  grid.style.gap = n >= 9 ? "3px" : "4px";
  grid.innerHTML = "";
  grid.classList.remove("won");
  cellEls = P.reg.map((g, i) => {
    const d = document.createElement("div");
    d.className = "cell";
    d.dataset.i = i;
    d.style.setProperty("--rc", `var(--r${g + 1})`);
    d.setAttribute("role", "button");
    grid.appendChild(d);
    return d;
  });
  $("counter").innerHTML = INVADER_SVG.repeat(n);
  $("diff").innerHTML = difficultySVG(diffTier(P.score));
  renderHeader();
}

function renderHeader() {
  $("lvl").textContent = t("level.short", { n: S.level });
  const label = t("diff.label", { d: t(`diff.${diffTier(P.score)}`) });
  $("diff").title = label;
  $("diff").setAttribute("aria-label", label);
}

function renderCell(i) {
  const s = S.game.cells[i], d = cellEls[i];
  const err = S.game.err.includes(i);
  d.className = "cell" + (s === INVADER ? " inv" : "") + (s === LOCKED ? " auto" : "") + (err ? " err" : "");
  d.innerHTML = s === INVADER ? INVADER_SVG : s === CROSS || s === LOCKED ? CROSS_SVG : "";
  d.setAttribute("aria-label", t("cell", { r: rowOf(P, i) + 1, c: colOf(P, i) + 1 }) +
    (s === INVADER ? t("cell.invader") : s ? t("cell.cross") : ""));
}

function render() { P.reg.forEach((_, i) => renderCell(i)); renderHUD(); }

function renderHUD() {
  const h = S.game.hearts;
  $("hearts").innerHTML = HEART_SVG.repeat(3);
  [...$("hearts").children].forEach((el, k) => { if (k >= h) el.classList.add("lost"); });
  const placed = S.game.cells.filter(s => s === INVADER).length;
  [...$("counter").children].forEach((el, k) => el.classList.toggle("off", k >= placed));
  $("cHint").textContent = S.learning ? "∞" : S.bonus.hint;
  $("bHint").classList.toggle("empty", !S.learning && !S.bonus.hint);
  $("learnTag").hidden = !S.learning;
  $("learningState").textContent = S.learning ? "ON" : "OFF";
  $("learningState").classList.toggle("on", S.learning);
  $("btnLearning").setAttribute("aria-checked", String(S.learning));
}

let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2000);
}

/* ---------- Coups ---------- */
function place(i) {
  const G = S.game;
  G.cells[i] = INVADER;
  G.err = G.err.filter(e => e !== i);
  renderCell(i); renderHUD(); save();
  flashCollected(G.cells.filter(s => s === INVADER).length - 1);
  if (isComplete(P, G.cells)) setTimeout(win, 350);
}

// Flash blanc sur l'envahisseur qui s'allume dans la barre du haut.
function flashCollected(k) {
  const el = $("counter").children[k];
  if (!el || reducedMotion()) return;
  el.classList.remove("got");
  void el.getBoundingClientRect(); // relance l'animation
  el.classList.add("got");
  el.addEventListener("animationend", () => el.classList.remove("got"), { once: true });
}

function attempt(i) {
  const G = S.game;
  if (G.hearts <= 0) return;
  if (isSolution(P, i)) { S.stats.invadersFound++; place(i); return; }
  G.run.errors++;
  G.hearts--;
  G.cells[i] = LOCKED;
  G.err.push(i);
  renderCell(i); renderHUD();
  $("hearts").children[G.hearts]?.classList.add("hit");
  try { navigator.vibrate?.(60); } catch { /* pas de vibreur */ }
  save();
  if (G.hearts === 0) setTimeout(lose, 500);
}

// Change l'état d'une case avec un petit flash.
function setCell(i, state) {
  S.game.cells[i] = state;
  renderCell(i);
  const d = cellEls[i];
  d.classList.remove("tap"); void d.offsetWidth; d.classList.add("tap");
  d.addEventListener("animationend", () => d.classList.remove("tap"), { once: true });
}

// 1 tap : pose ou efface une croix. Double tap (< 300 ms, même case) : envahisseur.
// Le 1er tap s'affiche tout de suite ; au 2e, la case reprend son état d'avant puis l'envahisseur est tenté.
const DOUBLE_TAP = 300;
let lastTap = null;
function tap(i) {
  const s = S.game.cells[i], now = performance.now();
  if (lastTap && lastTap.i === i && now - lastTap.t < DOUBLE_TAP) {
    const prev = lastTap.prev;
    lastTap = null;
    if (prev === EMPTY || prev === CROSS) { S.game.cells[i] = prev; attempt(i); }
    return;
  }
  lastTap = { i, t: now, prev: s };
  if (s === EMPTY) { setCell(i, CROSS); save(); }
  else if (s === CROSS) { setCell(i, EMPTY); save(); }
  else if (s === LOCKED) {
    const d = cellEls[i];
    d.classList.remove("err"); void d.offsetWidth; d.classList.add("err");
    setTimeout(() => renderCell(i), 400);
  }
}

// Glisser : poser (depuis une case vide) ou retirer (depuis une croix) des croix en série.
let drag = null;
function cellAt(x, y) {
  const c = document.elementFromPoint(x, y)?.closest(".cell");
  return c && grid.contains(c) ? +c.dataset.i : null;
}
grid.addEventListener("pointerdown", e => {
  if (grid.classList.contains("has-focus") || !$("explain").hidden) clearHint();
  const i = cellAt(e.clientX, e.clientY);
  if (i === null || S.game.hearts <= 0) return;
  const s = S.game.cells[i];
  drag = { start: i, last: i, moved: false, mode: s === EMPTY ? "paint" : s === CROSS ? "erase" : null };
  grid.setPointerCapture(e.pointerId);
});
grid.addEventListener("pointermove", e => {
  if (!drag || !drag.mode) return;
  const i = cellAt(e.clientX, e.clientY);
  if (i === null || i === drag.last) return;
  const apply = j => {
    const s = S.game.cells[j];
    if (drag.mode === "paint" && s === EMPTY) setCell(j, CROSS);
    else if (drag.mode === "erase" && s === CROSS) setCell(j, EMPTY);
  };
  if (!drag.moved) { drag.moved = true; apply(drag.start); }
  apply(i);
  drag.last = i;
});
grid.addEventListener("pointerup", () => {
  if (!drag) return;
  if (!drag.moved) tap(drag.start); else save();
  drag = null;
});
grid.addEventListener("pointercancel", () => { drag = null; save(); });

/* ---------- Indice ---------- */

// Indice en deux temps : 1) où regarder (on peut chercher seul), 2) le raisonnement pas à pas.
// Un indice payé reste disponible gratuitement tant que la grille n'a pas changé.
let pendingHint = null; // { hint, sig, level }
const boardSig = () => S.game.cells.join("");

function clearHint() {
  cellEls.forEach(d => d.classList.remove("focus", "hl"));
  grid.classList.remove("has-focus");
  $("explain").hidden = true;
  document.body.classList.remove("hint-open");
}
function setPanel({ title, look, steps = null, tip = null, stage }) {
  $("explainTitle").textContent = title;
  $("explainLook").textContent = look;
  $("explainSteps").hidden = !steps;
  $("explainSteps").innerHTML = "";
  (steps || []).forEach(t => { const li = document.createElement("li"); li.textContent = t; $("explainSteps").appendChild(li); });
  $("explainTip").hidden = !tip;
  $("explainTip").innerHTML = "";
  if (tip) { const b = document.createElement("b"); b.textContent = t("hint.tip"); $("explainTip").append(b, tip); }
  $("explainSelf").hidden = $("explainMore").hidden = stage !== "look";
  $("explainOk").hidden = stage !== "steps";
  $("explain").hidden = false;
  document.body.classList.add("hint-open");
}
function showLook(h) {
  clearHint();
  h.focus.forEach(i => cellEls[i].classList.add("focus"));
  grid.classList.add("has-focus");
  setPanel({ title: "", look: `${h.look} ${t("hint.lookSuffix")}`, stage: "look" });
}
// L'explication ne touche pas la grille : le joueur applique lui-même la déduction (preuve qu'il a compris).
// followHint suit cette déduction ; quand elle est appliquée, un message le confirme.
let followHint = null;
function hintApplied(h, cells) {
  if (h.kind === "cross") return h.cells.every(i => cells[i] === CROSS || cells[i] === LOCKED);
  if (h.kind === "place") return cells[h.cells[0]] === INVADER;
  return cells[h.cells[0]] !== CROSS; // fix : croix retirée
}
function checkFollow() {
  if (!followHint || !S.game || followHint.level !== S.level) return;
  if (!hintApplied(followHint.hint, S.game.cells)) return;
  toast(t("hint.applied"));
  followHint = null;
}
function showSteps(h) {
  followHint = { hint: h, level: S.level };
  clearHint();
  h.focus.forEach(i => cellEls[i].classList.add("focus"));
  h.cells.forEach(i => cellEls[i].classList.add("focus", "hl"));
  grid.classList.add("has-focus");
  setPanel({ title: `· ${h.technique}`, look: h.look, steps: h.steps, tip: h.tip, stage: "steps" });
  $("explainOk").textContent = t("hint.myTurn");
}
$("bHint").onclick = () => {
  if (S.game.hearts <= 0) return;
  if (pendingHint && pendingHint.level === S.level && pendingHint.sig === boardSig()) return showSteps(pendingHint.hint);
  if (!S.learning && !S.bonus.hint) return toast(t("hint.none"));
  const hint = findHint(P, S.game.cells, getLang());
  if (!S.learning) S.bonus.hint--;
  S.game.run.hints++;
  if (S.learning) S.game.run.hintsLearning++;
  renderHUD(); save();
  pendingHint = { hint, sig: boardSig(), level: S.level };
  showLook(hint);
};
$("explainMore").onclick = () => { if (pendingHint) showSteps(pendingHint.hint); };
$("explainSelf").onclick = () => { $("explain").hidden = true; document.body.classList.remove("hint-open"); toast(t("hint.again")); };
$("explainOk").onclick = clearHint;

/* ---------- Fenêtres ---------- */
const modal = $("modal");
function openModal(html, { lock = false } = {}) {
  $("sheet").innerHTML = html;
  modal.dataset.lock = lock ? "1" : "";
  modal.hidden = false;
}
function closeModal() { modal.hidden = true; modal.dataset.lock = ""; }
modal.addEventListener("click", e => { if (e.target === modal && !modal.dataset.lock) closeModal(); });

// +1 indice tous les 2 niveaux (le mode Learning n'en a pas besoin).
export const rewardFor = level => ({ hint: level % 2 === 0 ? 1 : 0 });

function win() {
  tickTime();
  const level = S.level, r = rewardFor(level), run = S.game.run, perfect = run.errors === 0; // aucune erreur, tous essais confondus
  S.stats = recordWin(S.stats, { level, n: P.n, run, perfect });
  const recap = t("win.summary", { streak: tn("days", currentStreak(S.stats)), time: formatTime(run.ms), tries: tn("tries", run.attempts) });
  const invaders = cellEls.filter(d => d.classList.contains("inv"));
  grid.classList.add("won");
  if (!S.learning) S.bonus.hint += r.hint;
  S.level = level + 1;
  S.maxLevel = Math.max(S.maxLevel, S.level);
  S.game = null;
  save();
  const parts = !S.learning && r.hint ? [t("win.reward")] : [];
  const show = () => {
    openModal(`<div class="big-inv">${INVADER_SVG}</div><h2>${t("win.title", { n: level })}</h2>
      ${perfect ? `<p class="small">${t("win.perfect")}</p>` : ""}
      <p class="small">${recap}</p>
      <div class="reward">${parts.map(p => `<span>${p}</span>`).join("")}</div>
      <button class="btn" id="next">${t("win.next", { n: level + 1 })}</button>
      <button class="btn ghost" id="winStats">${t("win.stats")}</button>`, { lock: true });
    $("next").onclick = () => { closeModal(); startLevel(S.level); };
    $("winStats").onclick = () => showStats(show); // « Compris » ramène à cette fenêtre
  };
  if (perfect && !reducedMotion()) setTimeout(show, explode($("fx"), invaders));
  else show();
}

function lose() {
  openModal(`<h2>${t("lose.title")}</h2><p class="small">${t("lose.text")}</p>
    <button class="btn" id="retry">${t("lose.retry", { n: S.level })}</button>`, { lock: true });
  $("retry").onclick = () => { closeModal(); newGame({ retry: true }); render(); };
}

/* ---------- Menu ---------- */
const menu = $("menu"), btnMenu = $("btnMenu");
function setMenu(open) { menu.hidden = !open; btnMenu.setAttribute("aria-expanded", String(open)); }
btnMenu.onclick = e => { e.stopPropagation(); setMenu(menu.hidden); };
document.addEventListener("click", e => { if (!menu.hidden && !e.target.closest(".menu-wrap")) setMenu(false); });
document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

function showRules(onClose) {
  setMenu(false);
  openModal(`<h2>${t("rules.title")}</h2><ul>
    ${[1, 2, 3, 4, 5, 6, 7].map(k => `<li>${t(`rules.${k}`)}</li>`).join("")}
    </ul><button class="btn" id="ok">${t("hint.ok")}</button>`);
  $("ok").onclick = () => { closeModal(); onClose?.(); };
}
$("btnRules").onclick = () => showRules();

$("btnLearning").onclick = () => {
  setMenu(false);
  S.learning = !S.learning;
  save(); renderHUD();
  toast(t(S.learning ? "learning.on" : "learning.off"));
};

/* ---------- Stats ---------- */
// Barres pixel : une par grille, hauteur = erreurs (plafonnée à 6), vert si aucune erreur.
function errorChart(errors) {
  const W = HISTORY * 3, H = 7;
  const bars = errors.map((e, k) => {
    const h = Math.min(e, 6) + 1, color = e === 0 ? "#5FD068" : e <= 2 ? "#FFA53D" : "#FF5A6E";
    return `<rect x="${k * 3}" y="${H - h}" width="2" height="${h}" fill="${color}"/>`;
  }).join("");
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" shape-rendering="crispEdges" role="img"
    aria-label="${errors.join(", ")}"><rect x="0" y="${H - 0.15}" width="${W}" height="0.15" fill="var(--line)"/>${bars}</svg>`;
}

// onClose : où revenir après « Compris » (fenêtre de fin de grille) ; sinon on ferme.
function showStats(onClose) {
  setMenu(false);
  tickTime();
  const m = summary(S.stats), none = "–";
  const kpi = (v, l, sub = "", wide = false) =>
    `<div class="kpi${wide ? " wide" : ""}"><span class="v">${v}</span><span class="l">${l}</span>${sub ? `<span class="s">${sub}</span>` : ""}</div>`;
  const times = m.times.length ? `<h3>${t("stats.times")}</h3>
    <table class="times"><tr><th>${t("stats.size")}</th><th>${t("stats.avg")}</th><th>${t("stats.bestTime")}</th><th>${t("stats.count")}</th></tr>
    ${m.times.map(x => `<tr><td>${x.n}×${x.n}</td><td>${formatTime(x.avg)}</td><td>${formatTime(x.best)}</td><td>${x.count}</td></tr>`).join("")}</table>` : "";
  const chart = m.errors.length ? `<h3>${t("stats.errors", { n: m.errors.length })}</h3>${errorChart(m.errors)}<p class="small">${t("stats.errorsHint")}</p>` : "";
  openModal(`<h2>${t("stats.title")}</h2>
    ${m.solved ? "" : `<p class="small">${t("stats.empty")}</p>`}
    <div class="kpis">
      ${kpi(tn("days", m.streak), t("stats.streak"), t("stats.best", { v: tn("days", m.bestStreak) }))}
      ${kpi(fmt(m.invadersFound, 0), t("stats.found"))}
      ${kpi(m.avgAttempts === null ? none : fmt(m.avgAttempts), t("stats.attempts"))}
      ${kpi(fmt(m.solved, 0), t("stats.solved"), m.perfectRate === null ? "" : t("stats.perfect", { v: pct(m.perfectRate) }))}
      ${kpi(m.avgHints === null ? none : fmt(m.avgHints), t("stats.hints"), m.hintsLearning ? t("stats.hintsLearning", { v: m.hintsLearning }) : "", true)}
    </div>
    ${times}${chart}
    <button class="btn" id="ok">${t(onClose ? "stats.back" : "hint.ok")}</button>`, { lock: !!onClose });
  $("ok").onclick = () => (onClose ? onClose() : closeModal());
}
$("btnStats").onclick = () => showStats();

$("btnSettings").onclick = () => {
  setMenu(false);
  openModal(`<h2>${t("settings.title")}</h2>
    <div class="row"><label for="optLvl">${t("settings.goto", { n: S.maxLevel })}</label>
      <input type="number" id="optLvl" min="1" max="${S.maxLevel}" value="${S.level}"></div>
    <button class="btn" id="go">${t("settings.go")}</button>
    <button class="btn ghost" id="restart">${t("settings.restart")}</button>
    <button class="btn ghost" id="reset">${t("settings.reset")}</button>
    <div id="confirm" hidden><p class="small">${t("settings.confirm")}</p>
      <div class="row"><button class="btn ghost" id="no">${t("settings.cancel")}</button><button class="btn danger" id="yes">${t("settings.erase")}</button></div></div>
    <p class="small">${t("settings.version", { v: document.documentElement.dataset.version || "" })}</p>`);
  $("go").onclick = () => {
    const v = Math.max(1, Math.min(S.maxLevel, parseInt($("optLvl").value, 10) || 1));
    closeModal();
    if (v !== S.level) { S.game = null; startLevel(v); }
  };
  $("restart").onclick = () => { closeModal(); newGame({ retry: true }); render(); };
  $("reset").onclick = () => { $("confirm").hidden = false; };
  $("no").onclick = () => { $("confirm").hidden = true; };
  $("yes").onclick = () => { const lang = S.lang; S = defaultState(); S.lang = lang; save(); closeModal(); startLevel(1); };
};

/* ---------- Écran d'accueil ---------- */
function setupSplash(firstVisit) {
  document.querySelector(".logo").innerHTML =
    [..."INVADOKU"].map((ch, k) => `<span style="animation-delay:${k * 90}ms">${ch}</span>`).join("");
  $("fleet").innerHTML = INVADER_SVG.repeat(5);
  // mini-grille 4×4 résolue : 4 zones, 4 envahisseurs
  const zones = [0, 0, 1, 1, 0, 0, 1, 1, 3, 2, 2, 1, 3, 2, 2, 2], inv = [1, 7, 8, 14];
  $("splashGrid").innerHTML = zones.map((g, i) =>
    `<i style="--rc:var(--r${g + 1});animation-delay:${(i % 5) * 0.3}s">${inv.includes(i) ? INVADER_SVG : ""}</i>`).join("");
  renderPlayLabel();
  document.querySelectorAll(".lang-toggle button").forEach(b => {
    b.onclick = () => { S.lang = b.dataset.lang; save(); applyLang(); };
  });
  $("play").onclick = () => {
    const sp = $("splash");
    sp.classList.add("out");
    startTimer();
    if (!firstVisit) reveal();
    setTimeout(() => { sp.hidden = true; if (firstVisit) showRules(reveal); }, 350);
  };
}

function renderPlayLabel() {
  $("play").textContent = S.level > 1 ? t("splash.playLevel", { n: S.level }) : t("splash.play");
}

/* ---------- Langue ---------- */
function applyLang() {
  setLang(S.lang || detectLang());
  translatePage();
  document.querySelectorAll(".lang-toggle button").forEach(b => b.setAttribute("aria-checked", String(b.dataset.lang === getLang())));
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("app.description"));
  pendingHint = null; // un indice déjà calculé est dans l'ancienne langue
  if (P) { renderHeader(); render(); }
  renderPlayLabel();
}

/* ---------- Démarrage ---------- */
hydrateIcons();
setLang(S.lang || detectLang());
startLevel(S.level, { animate: false }); // la vague part quand l'écran d'accueil se ferme
setupSplash(S.level === 1 && S.game.cells.every(s => s === EMPTY));
applyLang();

if ("serviceWorker" in navigator && location.protocol !== "file:" && document.documentElement.dataset.build !== "artifact") {
  navigator.serviceWorker.register("./sw.js").catch(() => { /* hors-ligne indisponible */ });
}
