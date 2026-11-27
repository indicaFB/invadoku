// Sauvegarde locale versionnée. Toute évolution du format passe par migrate(),
// pour qu'une mise à jour du jeu ne fasse pas perdre la progression.
import { emptyStats } from "./stats.js";

const KEY = "invadoku";
export const SCHEMA = 3;

export const defaultState = () => ({
  schema: SCHEMA,
  level: 1,
  maxLevel: 1,
  bonus: { hint: 6 },
  learning: false, // mode Learning : indices illimités
  lang: null,      // "fr" | "en" ; null = langue du navigateur
  stats: emptyStats(),
  game: null, // { sig, level, cells, err, hearts }
});

export function migrate(raw) {
  if (!raw || typeof raw !== "object") return defaultState();
  const s = { ...defaultState(), ...raw };
  // Conversions, dans l'ordre des schémas :
  // 1 → 2 : le Radar disparaît, ajout du mode Learning.
  // 2 → 3 : ajout des statistiques (vides au départ).
  s.schema = SCHEMA;
  s.learning = raw.learning === true;
  s.lang = ["fr", "en"].includes(raw.lang) ? raw.lang : null;
  const st = raw.stats && typeof raw.stats === "object" ? raw.stats : {};
  s.stats = { ...emptyStats(), ...st, streak: { ...emptyStats().streak, ...(st.streak || {}) }, time: { ...(st.time || {}) } };
  s.level = Math.max(1, s.level | 0);
  s.maxLevel = Math.max(s.level, s.maxLevel | 0);
  s.bonus = { hint: Number.isFinite(raw.bonus?.hint) ? raw.bonus.hint : defaultState().bonus.hint };
  return s;
}

// Sauvegarde de la toute première version (artifact « Invasion Logique ») : indices dans bonus.h.
const LEGACY_KEY = "invasion_logique_v1";
function fromLegacy(old) {
  if (!old || typeof old !== "object") return null;
  return { level: old.level, maxLevel: old.maxLevel, game: old.game || null,
    bonus: { hint: old.bonus?.h ?? 6 } };
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
    return migrate(fromLegacy(JSON.parse(storage.getItem(LEGACY_KEY))));
  } catch { return defaultState(); }
}

export function saveState(state, storage = globalThis.localStorage) {
  try { storage.setItem(KEY, JSON.stringify(state)); } catch { /* stockage indisponible : on joue sans sauvegarde */ }
}
