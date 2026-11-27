// Service worker : met tout le jeu en cache pour jouer hors ligne.
// À chaque version publiée, changer VERSION (et data-version dans index.html) :
// l'ancien cache est supprimé et les joueurs reçoivent les nouveaux fichiers.
const VERSION = "0.5.0";
const CACHE = `invadoku-${VERSION}`;
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/style.css",
  "js/app.js", "js/fx.js", "js/generator.js", "js/hints.js", "js/i18n.js", "js/levels.js",
  "js/rater.js", "js/rules.js", "js/sprites.js", "js/storage.js",
  "fonts/press-start-2p-400.woff2",
  "fonts/space-grotesk-400.woff2", "fonts/space-grotesk-500.woff2", "fonts/space-grotesk-700.woff2",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("invadoku-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Cache d'abord, réseau ensuite (le jeu n'appelle aucun service extérieur).
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)),
  );
});
