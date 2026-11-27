// Statistiques personnelles, calculées à chaque grille réussie. Fonctions pures : testables sans navigateur.
//
// Définitions
//   Série      : jours consécutifs (date locale) avec au moins une grille réussie. Record conservé.
//   Essais     : 1 par grille, +1 à chaque « Plus de vies » ou « Recommencer » sur la même grille.
//   Erreurs    : envahisseurs mal placés sur la grille, tous essais confondus.
//   Temps      : temps de jeu actif (page visible, écran d'accueil fermé), par taille de grille.
//   Envahisseurs trouvés : posés par le joueur (ceux posés par un indice ne comptent pas).
export const HISTORY = 20;

export const emptyStats = () => ({
  invadersFound: 0,
  solved: 0,
  perfect: 0,
  attempts: 0,       // somme des essais des grilles réussies
  hints: 0,          // indices utilisés sur les grilles réussies
  hintsLearning: 0,  // dont en mode Learning
  time: {},          // { "5": { count, total, best } } en ms
  history: [],       // 20 dernières grilles : { level, n, errors, attempts, hints, ms }
  streak: { current: 0, best: 0, lastDay: null },
});

// Compteurs propres à la grille en cours (rangés dans state.game).
export const newRun = () => ({ attempts: 1, errors: 0, hints: 0, hintsLearning: 0, ms: 0 });

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function daysBetween(a, b) {
  const [ya, ma, da] = a.split("-").map(Number), [yb, mb, db] = b.split("-").map(Number);
  return Math.round((Date.UTC(yb, mb - 1, db) - Date.UTC(ya, ma - 1, da)) / 86400000);
}

// Série affichée : retombe à 0 si le joueur n'a rien réussi ni hier ni aujourd'hui.
export function currentStreak(stats, today = dayKey()) {
  const { lastDay, current } = stats.streak;
  if (!lastDay) return 0;
  return daysBetween(lastDay, today) <= 1 ? current : 0;
}

// Enregistre une grille réussie. run = compteurs de la grille ; renvoie les stats mises à jour.
export function recordWin(stats, { level, n, run, perfect }, today = dayKey()) {
  const s = structuredClone(stats);
  s.solved++;
  if (perfect) s.perfect++;
  s.attempts += run.attempts;
  s.hints += run.hints;
  s.hintsLearning += run.hintsLearning;
  const tk = String(n), t = s.time[tk] || { count: 0, total: 0, best: null };
  t.count++; t.total += run.ms; t.best = t.best === null ? run.ms : Math.min(t.best, run.ms);
  s.time[tk] = t;
  s.history = [...s.history, { level, n, errors: run.errors, attempts: run.attempts, hints: run.hints, ms: run.ms }].slice(-HISTORY);

  const st = s.streak;
  if (st.lastDay !== today) {
    st.current = st.lastDay && daysBetween(st.lastDay, today) === 1 ? st.current + 1 : 1;
    st.lastDay = today;
  }
  st.best = Math.max(st.best, st.current);
  return s;
}

// Valeurs affichées dans la page Stats.
export function summary(stats, today = dayKey()) {
  const avg = (a, b) => (b ? a / b : null);
  return {
    streak: currentStreak(stats, today),
    bestStreak: stats.streak.best,
    invadersFound: stats.invadersFound,
    solved: stats.solved,
    perfectRate: avg(stats.perfect, stats.solved),
    avgAttempts: avg(stats.attempts, stats.solved),
    avgHints: avg(stats.hints, stats.solved),
    hintsLearning: stats.hintsLearning,
    times: Object.entries(stats.time).map(([n, t]) => ({ n: +n, avg: t.total / t.count, best: t.best, count: t.count }))
      .sort((a, b) => a.n - b.n),
    errors: stats.history.map(h => h.errors),
  };
}

export function formatTime(ms) {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
