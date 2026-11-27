// Interface du jeu : rendu, gestes, bonus, fenêtres, écran d'accueil.
import { puzzleFor, diffLabel } from "./levels.js";
import { EMPTY, CROSS, LOCKED, INVADER, isSolution, isComplete, rowOf, colOf } from "./rules.js";
import { findHint } from "./hints.js";
import { INVADER_SVG, CROSS_SVG, HEART_SVG, hydrateIcons } from "./sprites.js";
import { loadState, saveState, defaultState } from "./storage.js";
import { explode } from "./fx.js";

const $ = id => document.getElementById(id);
const grid = $("grid");
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

let S = loadState();
let P = null;          // grille courante { n, reg, sol, score, level }
let cellEls = [];
const save = () => saveState(S);

/* ---------- Partie ---------- */
function newGame() {
  S.game = { sig: P.reg.join(""), level: S.level, cells: new Array(P.n * P.n).fill(EMPTY), err: [], hearts: 3 };
  save();
}

function startLevel(level, { animate = true } = {}) {
  clearHint();
  S.level = level;
  P = puzzleFor(level);
  if (!S.game || S.game.level !== level || S.game.sig !== P.reg.join("")) newGame();
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
  $("lvl").textContent = "Niveau : " + S.level;
  $("diff").textContent = `${n}×${n} · ${diffLabel(P.score)}`;
}

function renderCell(i) {
  const s = S.game.cells[i], d = cellEls[i];
  const err = S.game.err.includes(i);
  d.className = "cell" + (s === INVADER ? " inv" : "") + (s === LOCKED ? " auto" : "") + (err ? " err" : "");
  d.innerHTML = s === INVADER ? INVADER_SVG : s === CROSS || s === LOCKED ? CROSS_SVG : "";
  d.setAttribute("aria-label", `Ligne ${rowOf(P, i) + 1}, colonne ${colOf(P, i) + 1}` +
    (s === INVADER ? ", envahisseur" : s ? ", croix" : ""));
}

function render() { P.reg.forEach((_, i) => renderCell(i)); renderHUD(); }

function renderHUD() {
  const h = S.game.hearts;
  $("hearts").innerHTML = HEART_SVG.repeat(3);
  [...$("hearts").children].forEach((el, k) => { if (k >= h) el.classList.add("lost"); });
  const placed = S.game.cells.filter(s => s === INVADER).length;
  [...$("counter").children].forEach((el, k) => el.classList.toggle("off", k >= placed));
  $("cSearch").textContent = S.bonus.radar;
  $("cHint").textContent = S.bonus.hint;
  $("bSearch").classList.toggle("empty", !S.bonus.radar);
  $("bHint").classList.toggle("empty", !S.bonus.hint);
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
  if (isComplete(P, G.cells)) setTimeout(win, 350);
}

function attempt(i) {
  const G = S.game;
  if (G.hearts <= 0) return;
  if (isSolution(P, i)) { place(i); return; }
  G.hearts--;
  G.cells[i] = LOCKED;
  G.err.push(i);
  renderCell(i); renderHUD();
  $("hearts").children[G.hearts]?.classList.add("hit");
  try { navigator.vibrate?.(60); } catch { /* pas de vibreur */ }
  save();
  if (G.hearts === 0) setTimeout(lose, 500);
}

function tap(i) {
  const s = S.game.cells[i];
  if (s === EMPTY) { S.game.cells[i] = CROSS; renderCell(i); save(); }
  else if (s === CROSS) attempt(i);
  else if (s === LOCKED) {
    const d = cellEls[i];
    d.classList.remove("err"); void d.offsetWidth; d.classList.add("err");
    setTimeout(() => renderCell(i), 400);
  }
}

// Tap : croix puis envahisseur. Glisser : poser (depuis une case vide) ou retirer (depuis une croix) des croix en série.
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
    if (drag.mode === "paint" && s === EMPTY) { S.game.cells[j] = CROSS; renderCell(j); }
    else if (drag.mode === "erase" && s === CROSS) { S.game.cells[j] = EMPTY; renderCell(j); }
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

/* ---------- Bonus ---------- */
$("bSearch").onclick = () => {
  if (!S.bonus.radar) return toast("Plus de radar disponible");
  const G = S.game, cand = [];
  G.cells.forEach((s, i) => { if ((s === EMPTY || s === CROSS) && !isSolution(P, i)) cand.push(i); });
  if (!cand.length) return toast("Aucune case à barrer");
  cand.sort(() => Math.random() - 0.5).slice(0, 5).forEach(i => {
    G.cells[i] = LOCKED; renderCell(i); cellEls[i].classList.add("hint");
  });
  S.bonus.radar--;
  renderHUD(); save();
  toast("Radar : cases sans envahisseur barrées");
};

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
  if (tip) { const b = document.createElement("b"); b.textContent = "À retenir : "; $("explainTip").append(b, tip); }
  $("explainSelf").hidden = $("explainMore").hidden = stage !== "look";
  $("explainOk").hidden = stage !== "steps";
  $("explain").hidden = false;
  document.body.classList.add("hint-open");
}
function showLook(h) {
  clearHint();
  h.focus.forEach(i => cellEls[i].classList.add("focus"));
  grid.classList.add("has-focus");
  setPanel({ title: "", look: `${h.look} Une déduction s'y cache.`, stage: "look" });
}
function showSteps(h) {
  const G = S.game;
  pendingHint = null;
  if (h.kind === "fix") { G.cells[h.cells[0]] = EMPTY; renderCell(h.cells[0]); }
  else if (h.kind === "cross") h.cells.forEach(i => { G.cells[i] = CROSS; renderCell(i); });
  save();
  if (h.kind === "place") place(h.cells[0]);
  clearHint();
  h.focus.forEach(i => cellEls[i].classList.add("focus"));
  h.cells.forEach(i => cellEls[i].classList.add("focus", "hl"));
  grid.classList.add("has-focus");
  setPanel({ title: `· ${h.technique}`, look: h.look, steps: h.steps, tip: h.tip, stage: "steps" });
}
$("bHint").onclick = () => {
  if (S.game.hearts <= 0) return;
  if (pendingHint && pendingHint.level === S.level && pendingHint.sig === boardSig()) return showSteps(pendingHint.hint);
  if (!S.bonus.hint) return toast("Plus d'indice disponible");
  const hint = findHint(P, S.game.cells);
  S.bonus.hint--;
  renderHUD(); save();
  pendingHint = { hint, sig: boardSig(), level: S.level };
  showLook(hint);
};
$("explainMore").onclick = () => { if (pendingHint) showSteps(pendingHint.hint); };
$("explainSelf").onclick = () => { $("explain").hidden = true; document.body.classList.remove("hint-open"); toast("Touchez Indice pour revoir l'explication"); };
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

export function rewardFor(level) {
  const r = { radar: 0, hint: 0 };
  if (level % 2 === 0) r.radar = 1;
  if (level % 3 === 0) r.hint = 1;
  if (!r.radar && !r.hint) r.radar = 1;
  return r;
}

function win() {
  const level = S.level, r = rewardFor(level), perfect = S.game.hearts === 3;
  const invaders = cellEls.filter(d => d.classList.contains("inv"));
  grid.classList.add("won");
  S.bonus.radar += r.radar; S.bonus.hint += r.hint;
  S.level = level + 1;
  S.maxLevel = Math.max(S.maxLevel, S.level);
  S.game = null;
  save();
  const parts = [r.radar && "+1 Radar", r.hint && "+1 Indice"].filter(Boolean);
  const show = () => {
    openModal(`<div class="big-inv">${INVADER_SVG}</div><h2>Niveau ${level} réussi</h2>
      ${perfect ? '<p class="small">Sans faute</p>' : ""}
      <div class="reward">${parts.map(p => `<span>${p}</span>`).join("")}</div>
      <button class="btn" id="next">Niveau ${level + 1}</button>`, { lock: true });
    $("next").onclick = () => { closeModal(); startLevel(S.level); };
  };
  if (perfect && !reducedMotion()) setTimeout(show, explode($("fx"), invaders));
  else show();
}

function lose() {
  openModal(`<h2>Plus de vies</h2><p class="small">Les envahisseurs ont gagné cette manche. La grille reste la même.</p>
    <button class="btn" id="retry">Recommencer le niveau ${S.level}</button>`, { lock: true });
  $("retry").onclick = () => { closeModal(); newGame(); render(); };
}

/* ---------- Menu ---------- */
const menu = $("menu"), btnMenu = $("btnMenu");
function setMenu(open) { menu.hidden = !open; btnMenu.setAttribute("aria-expanded", String(open)); }
btnMenu.onclick = e => { e.stopPropagation(); setMenu(menu.hidden); };
document.addEventListener("click", e => { if (!menu.hidden && !e.target.closest(".menu-wrap")) setMenu(false); });
document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

function showRules(onClose) {
  setMenu(false);
  openModal(`<h2>Règles</h2><ul>
    <li>Placez un envahisseur par <b>ligne</b>, par <b>colonne</b> et par <b>zone de couleur</b>.</li>
    <li>Deux envahisseurs ne se touchent jamais, même en diagonale.</li>
    <li>1 tap : croix. 2<sup>e</sup> tap sur une croix : envahisseur.</li>
    <li>Glissez le doigt pour poser ou retirer des croix en série.</li>
    <li>Un envahisseur mal placé coûte une vie. 3 vies par niveau. Sans faute, les envahisseurs explosent.</li>
    <li><b>Radar</b> barre 5 cases vides. <b>Indice</b> montre d'abord où regarder, puis le raisonnement pas à pas.</li>
    </ul><button class="btn" id="ok">Compris</button>`);
  $("ok").onclick = () => { closeModal(); onClose?.(); };
}
$("btnRules").onclick = () => showRules();

$("btnSettings").onclick = () => {
  setMenu(false);
  openModal(`<h2>Réglages</h2>
    <div class="row"><label for="optLvl">Aller au niveau (max ${S.maxLevel})</label>
      <input type="number" id="optLvl" min="1" max="${S.maxLevel}" value="${S.level}"></div>
    <button class="btn" id="go">Valider</button>
    <button class="btn ghost" id="restart">Recommencer ce niveau</button>
    <button class="btn ghost" id="reset">Réinitialiser la progression</button>
    <div id="confirm" hidden><p class="small">Tout effacer : niveaux et bonus ?</p>
      <div class="row"><button class="btn ghost" id="no">Annuler</button><button class="btn danger" id="yes">Effacer</button></div></div>
    <p class="small">Version ${document.documentElement.dataset.version || ""}</p>`);
  $("go").onclick = () => {
    const v = Math.max(1, Math.min(S.maxLevel, parseInt($("optLvl").value, 10) || 1));
    closeModal();
    if (v !== S.level) { S.game = null; startLevel(v); }
  };
  $("restart").onclick = () => { closeModal(); newGame(); render(); };
  $("reset").onclick = () => { $("confirm").hidden = false; };
  $("no").onclick = () => { $("confirm").hidden = true; };
  $("yes").onclick = () => { S = defaultState(); save(); closeModal(); startLevel(1); };
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
  $("play").textContent = S.level > 1 ? `Jouer · Niveau ${S.level}` : "Jouer";
  $("play").onclick = () => {
    const sp = $("splash");
    sp.classList.add("out");
    if (!firstVisit) reveal();
    setTimeout(() => { sp.hidden = true; if (firstVisit) showRules(reveal); }, 350);
  };
}

/* ---------- Démarrage ---------- */
hydrateIcons();
startLevel(S.level, { animate: false }); // la vague part quand l'écran d'accueil se ferme
setupSplash(S.level === 1 && S.game.cells.every(s => s === EMPTY));

if ("serviceWorker" in navigator && location.protocol !== "file:" && document.documentElement.dataset.build !== "artifact") {
  navigator.serviceWorker.register("./sw.js").catch(() => { /* hors-ligne indisponible */ });
}
