// Sauvegarde locale versionnée. Toute évolution du format passe par migrate(),
// pour qu'une mise à jour du jeu ne fasse pas perdre la progression.
const KEY = "invadoku";
export const SCHEMA = 1;

export const defaultState = () => ({
  schema: SCHEMA,
  level: 1,
  maxLevel: 1,
  bonus: { radar: 5, hint: 6 },
  game: null, // { sig, level, cells, err, hearts }
});

export function migrate(raw) {
  if (!raw || typeof raw !== "object") return defaultState();
  const s = { ...defaultState(), ...raw };
  // (schéma 2+ : ajouter ici les conversions, dans l'ordre)
  s.schema = SCHEMA;
  s.level = Math.max(1, s.level | 0);
  s.maxLevel = Math.max(s.level, s.maxLevel | 0);
  s.bonus = { ...defaultState().bonus, ...(raw.bonus || {}) };
  return s;
}

// Sauvegarde de la toute première version (artifact « Invasion Logique ») : bonus s/h au lieu de radar/hint.
const LEGACY_KEY = "invasion_logique_v1";
function fromLegacy(old) {
  if (!old || typeof old !== "object") return null;
  return { level: old.level, maxLevel: old.maxLevel, game: old.game || null,
    bonus: { radar: old.bonus?.s ?? 5, hint: old.bonus?.h ?? 6 } };
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
