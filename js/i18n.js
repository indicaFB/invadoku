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
    "win.title": "Niveau {n} réussi", "win.perfect": "Sans faute", "win.reward": "+1 Indice", "win.next": "Niveau {n}",
    "lose.title": "Plus de vies", "lose.text": "Les envahisseurs ont gagné cette manche. La grille reste la même.",
    "lose.retry": "Recommencer le niveau {n}",
    "rules.title": "Règles",
    "rules.1": "Placez un envahisseur par <b>ligne</b>, par <b>colonne</b> et par <b>zone de couleur</b>.",
    "rules.2": "Deux envahisseurs ne se touchent jamais, même en diagonale.",
    "rules.3": "1 tap : croix. 2<sup>e</sup> tap sur une croix : envahisseur.",
    "rules.4": "Glissez le doigt pour poser ou retirer des croix en série.",
    "rules.5": "Un envahisseur mal placé coûte une vie. 3 vies par niveau. Sans faute, les envahisseurs explosent.",
    "rules.6": "<b>Indice</b> montre d'abord où regarder, puis le raisonnement pas à pas.",
    "rules.7": "<b>Mode Learning</b> (menu) : indices illimités pour apprendre les déductions.",
    "settings.title": "Réglages", "settings.goto": "Aller au niveau (max {n})", "settings.go": "Valider",
    "settings.restart": "Recommencer ce niveau", "settings.reset": "Réinitialiser la progression",
    "settings.confirm": "Tout effacer : niveaux et indices ?", "settings.cancel": "Annuler", "settings.erase": "Effacer",
    "settings.version": "Version {v}",
    "splash.play": "Jouer", "splash.playLevel": "Jouer · Niveau {n}", "splash.tagline": "Un envahisseur par ligne, colonne et zone",
    "splash.lang": "Langue",
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
    "win.title": "Level {n} complete", "win.perfect": "Flawless", "win.reward": "+1 Hint", "win.next": "Level {n}",
    "lose.title": "Out of lives", "lose.text": "The invaders won this round. The grid stays the same.",
    "lose.retry": "Retry level {n}",
    "rules.title": "Rules",
    "rules.1": "Place one invader in each <b>row</b>, each <b>column</b> and each <b>colour zone</b>.",
    "rules.2": "Two invaders never touch, not even diagonally.",
    "rules.3": "1 tap: cross. 2nd tap on a cross: invader.",
    "rules.4": "Drag your finger to add or remove several crosses.",
    "rules.5": "A misplaced invader costs a life. 3 lives per level. Flawless levels make the invaders explode.",
    "rules.6": "<b>Hint</b> first shows where to look, then the reasoning step by step.",
    "rules.7": "<b>Learning mode</b> (menu): unlimited hints to learn the deductions.",
    "settings.title": "Settings", "settings.goto": "Go to level (max {n})", "settings.go": "Go",
    "settings.restart": "Restart this level", "settings.reset": "Reset progress",
    "settings.confirm": "Erase everything: levels and hints?", "settings.cancel": "Cancel", "settings.erase": "Erase",
    "settings.version": "Version {v}",
    "splash.play": "Play", "splash.playLevel": "Play · Level {n}", "splash.tagline": "One invader per row, column and zone",
    "splash.lang": "Language",
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
