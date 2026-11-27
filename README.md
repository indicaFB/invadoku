# Invadoku

Puzzle logique en pixel art. Placez un envahisseur par ligne, par colonne et par zone de couleur ; deux envahisseurs ne se touchent jamais, même en diagonale.

Application web installable (PWA) : écran d'accueil, plein écran, jeu hors ligne. Aucune dépendance, aucun service extérieur, aucune donnée collectée.

## Lancer

Node.js 18 ou plus.

```bash
npm start          # http://localhost:8080
npm test           # 22 tests : générateur, difficulté, indices, sauvegarde
npm run icons      # régénère les icônes PNG depuis le sprite
npm run artifact   # dist/invadoku.html : le jeu en une seule page (aperçu claude.ai)
```

Le service worker et les modules JavaScript demandent un serveur HTTP : ouvrir `index.html` en double-clic ne suffit pas.

### Essayer sur téléphone (même wifi)

1. `npm start` sur l'ordinateur : la console affiche une adresse `http://192.168.x.x:8080`.
2. Ouvrir cette adresse sur le téléphone.
3. Installer :
   - **Android (Chrome)** : menu ⋮ → *Installer l'application*.
   - **iPhone (Safari)** : bouton Partager → *Sur l'écran d'accueil*.

Sur un réseau local en `http://`, le mode hors ligne (service worker) ne s'active pas : les navigateurs l'exigent en HTTPS, sauf sur `localhost`. Le jeu fonctionne, mais demande la connexion à l'ordinateur. Pour le hors-ligne sur téléphone, passer par un hébergement HTTPS privé (voir `docs/SORTIE.md`).

## Structure

```
index.html            page unique
css/style.css         thème sombre, pixel art
js/
  app.js              interface : rendu, gestes, bonus, fenêtres, écran d'accueil
  generator.js        grilles à solution unique (graine fixe par niveau)
  rater.js            note de difficulté (coût des déductions)
  levels.js           progression : taille par tranche, difficulté montante
  hints.js            indice en deux temps : où regarder, puis raisonnement pas à pas
  rules.js            règles et états de case
  sprites.js          sprites pixel en SVG
  storage.js          sauvegarde locale versionnée (migrate)
  fx.js               explosion de pixels (niveau sans faute)
fonts/                Press Start 2P, Space Grotesk (licence SIL OFL 1.1)
icons/                icônes PNG générées par tools/make-icons.mjs
manifest.webmanifest  identité de l'app installée
sw.js                 cache hors ligne
tests/                node --test
tools/                serveur local, icônes, page unique pour l'artifact
```

## Publier une nouvelle version

1. Changer la version dans `package.json`, `index.html` (`data-version`) et `sw.js` (`VERSION`).
2. Si un fichier est ajouté ou renommé, l'ajouter à la liste `FILES` de `sw.js`.
3. Si le format de sauvegarde change, augmenter `SCHEMA` dans `js/storage.js` et ajouter la conversion dans `migrate()`.
4. `npm test`.

**Attention :** modifier `generator.js`, `rater.js` ou `BANDS` dans `levels.js` change les grilles de tous les niveaux. Le test « mêmes grilles que la version précédente » le signale.
