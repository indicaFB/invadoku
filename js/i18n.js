// Textes de l'interface, en français et en anglais.
// t("clé", { param }) renvoie le texte dans la langue courante ; {param} est remplacé.
// Les textes des indices sont dans hints.js (leur grammaire dépend des cases citées).
export const LANGS = ["fr", "en"];

const STRINGS = {
  fr: {
    "app.description": "Puzzle logique en pixel art : un envahisseur par ligne, colonne et zone.",
    "menu": "Menu", "menu.rules": "Règles", "menu.learning": "Mode Learning", "menu.settings": "Réglages",
    "hud.lives": "Vies", "hud.found": "Envahisseurs trouvés", "hud.learning": "Learning",
    "level.short": "#{n}",
    "diff.label": "Difficulté : {d}", "diff.0": "facile", "diff.1": "moyenne", "diff.2": "difficile",
    "cell": "Ligne {r}, colonne {c}", "cell.invader": ", envahisseur", "cell.cross": ", croix",
    "hint": "Indice", "hint.self": "Je cherche", "hint.more": "Voir l'explication", "hint.ok": "Compris",
    "hint.lookSuffix": "Une déduction s'y cache.", "hint.tip": "À retenir : ",
    "hint.none": "Plus d'indice disponible. Le mode Learning, dans le menu, les rend illimités.",
    "hint.again": "Touchez Indice pour revoir l'explication",
    "learning.on": "Mode Learning activé : indices illimités", "learning.off": "Mode Learning désactivé",
    "win.title": "Niveau {n} réussi", "win.perfect": "Sans faute", "win.reward": "+1 Indice", "win.next": "Niveau {n}", "win.stats": "Voir mes stats", "stats.back": "Retour",
    "lose.title": "Plus de vies", "lose.text": "Les envahisseurs ont gagné cette manche. La grille reste la même.",
    "lose.retry": "Recommencer le niveau {n}",
    "rules.title": "Règles",
    "rules.1": "Placez un envahisseur par <b>ligne</b>, par <b>colonne</b> et par <b>zone de couleur</b>.",
    "rules.2": "Deux envahisseurs ne se touchent jamais, même en diagonale.",
    "rules.3": "1 tap : pose ou efface une croix. <b>Double tap</b> : envahisseur.",
    "rules.4": "Glissez le doigt pour poser ou retirer des croix en série.",
    "rules.5": "Un envahisseur mal placé coûte une vie. 3 vies par niveau. Sans faute, les envahisseurs explosent.",
    "rules.6": "<b>Indice</b> montre d'abord où regarder, puis le raisonnement pas à pas.",
    "rules.7": "<b>Mode Learning</b> (menu) : indices illimités pour apprendre les déductions.",
    "settings.title": "Réglages", "settings.goto": "Aller au niveau (max {n})", "settings.go": "Valider",
    "settings.restart": "Recommencer ce niveau", "settings.reset": "Réinitialiser la progression",
    "settings.confirm": "Tout effacer : niveaux, indices et stats ?", "settings.cancel": "Annuler", "settings.erase": "Effacer",
    "settings.version": "Version {v}",
    "splash.play": "Jouer", "splash.playLevel": "Jouer · Niveau {n}", "splash.tagline": "Un envahisseur par ligne, colonne et zone",
    "splash.lang": "Langue",
    "menu.stats": "Stats",
    "stats.title": "Stats", "stats.empty": "Réussissez une grille pour lancer vos stats. Elles comptent à partir de cette version.",
    "stats.streak": "Série", "stats.best": "Record : {v}", "stats.found": "Envahisseurs trouvés",
    "stats.attempts": "Essais par grille", "stats.solved": "Grilles réussies", "stats.perfect": "Sans faute : {v}",
    "stats.hints": "Indices par grille", "stats.hintsLearning": "Dont Learning : {v}",
    "stats.times": "Temps par taille", "stats.size": "Grille", "stats.avg": "Moyen", "stats.bestTime": "Meilleur", "stats.count": "Grilles",
    "stats.errors": "Erreurs sur les {n} dernières grilles", "stats.errorsHint": "Chaque barre = une grille. Plus c'est bas, mieux c'est.",
    "days.one": "{n} jour", "days.other": "{n} jours", "tries.one": "{n} essai", "tries.other": "{n} essais",
    "win.summary": "Série : {streak} · {time} · {tries}",
  },
  en: {
    "app.description": "Pixel-art logic puzzle: one invader per row, column and zone.",
    "menu": "Menu", "menu.rules": "Rules", "menu.learning": "Learning mode", "menu.settings": "Settings",
    "hud.lives": "Lives", "hud.found": "Invaders found", "hud.learning": "Learning",
    "level.short": "#{n}",
    "diff.label": "Difficulty: {d}", "diff.0": "easy", "diff.1": "medium", "diff.2": "hard",
    "cell": "Row {r}, column {c}", "cell.invader": ", invader", "cell.cross": ", cross",
    "hint": "Hint", "hint.self": "Let me look", "hint.more": "Show the reasoning", "hint.ok": "Got it",
    "hint.lookSuffix": "There is a deduction hidden there.", "hint.tip": "Remember: ",
    "hint.none": "No hints left. Learning mode, in the menu, makes them unlimited.",
    "hint.again": "Tap Hint to see the reasoning again",
    "learning.on": "Learning mode on: unlimited hints", "learning.off": "Learning mode off",
    "win.title": "Level {n} complete", "win.perfect": "Flawless", "win.reward": "+1 Hint", "win.next": "Level {n}", "win.stats": "See my stats", "stats.back": "Back",
    "lose.title": "Out of lives", "lose.text": "The invaders won this round. The grid stays the same.",
    "lose.retry": "Retry level {n}",
    "rules.title": "Rules",
    "rules.1": "Place one invader in each <b>row</b>, each <b>column</b> and each <b>colour zone</b>.",
    "rules.2": "Two invaders never touch, not even diagonally.",
    "rules.3": "Tap: add or remove a cross. <b>Double tap</b>: invader.",
    "rules.4": "Drag your finger to add or remove several crosses.",
    "rules.5": "A misplaced invader costs a life. 3 lives per level. Flawless levels make the invaders explode.",
    "rules.6": "<b>Hint</b> first shows where to look, then the reasoning step by step.",
    "rules.7": "<b>Learning mode</b> (menu): unlimited hints to learn the deductions.",
    "settings.title": "Settings", "settings.goto": "Go to level (max {n})", "settings.go": "Go",
    "settings.restart": "Restart this level", "settings.reset": "Reset progress",
    "settings.confirm": "Erase everything: levels, hints and stats?", "settings.cancel": "Cancel", "settings.erase": "Erase",
    "settings.version": "Version {v}",
    "splash.play": "Play", "splash.playLevel": "Play · Level {n}", "splash.tagline": "One invader per row, column and zone",
    "splash.lang": "Language",
    "menu.stats": "Stats",
    "stats.title": "Stats", "stats.empty": "Complete a grid to start your stats. They count from this version on.",
    "stats.streak": "Streak", "stats.best": "Best: {v}", "stats.found": "Invaders found",
    "stats.attempts": "Attempts per grid", "stats.solved": "Grids completed", "stats.perfect": "Flawless: {v}",
    "stats.hints": "Hints per grid", "stats.hintsLearning": "Learning: {v}",
    "stats.times": "Time by size", "stats.size": "Grid", "stats.avg": "Average", "stats.bestTime": "Best", "stats.count": "Grids",
    "stats.errors": "Mistakes over the last {n} grids", "stats.errorsHint": "Each bar = one grid. Lower is better.",
    "days.one": "{n} day", "days.other": "{n} days", "tries.one": "{n} attempt", "tries.other": "{n} attempts",
    "win.summary": "Streak: {streak} · {time} · {tries}",
  },
};

let current = "fr";
export const getLang = () => current;
export function setLang(lang) {
  current = LANGS.includes(lang) ? lang : "fr";
  if (globalThis.document) document.documentElement.lang = current;
}
export function detectLang() {
  const nav = (globalThis.navigator?.language || "fr").toLowerCase();
  return nav.startsWith("fr") ? "fr" : "en";
}

// Pluriel : clés « x.one » et « x.other ».
export const tn = (key, n) => t(`${key}.${n === 1 ? "one" : "other"}`, { n });
export const fmt = (v, digits = 1) => new Intl.NumberFormat(current, { maximumFractionDigits: digits }).format(v);
export const pct = v => new Intl.NumberFormat(current, { style: "percent", maximumFractionDigits: 0 }).format(v);

export function t(key, params = {}) {
  const s = STRINGS[current][key] ?? STRINGS.fr[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in params ? params[k] : `{${k}}`));
}

// Applique les traductions aux éléments marqués data-i18n (texte) ou data-i18n-aria (aria-label).
export function translatePage(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => {
    // garde les icônes : remplace seulement le nœud texte
    const node = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
    if (node) node.textContent = t(el.dataset.i18n); else el.append(t(el.dataset.i18n));
  });
  root.querySelectorAll("[data-i18n-aria]").forEach(el => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
}

export const STRING_KEYS = Object.fromEntries(LANGS.map(l => [l, Object.keys(STRINGS[l])]));
