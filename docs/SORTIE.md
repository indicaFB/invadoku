# Préparer la sortie

Rien ici n'est urgent : c'est la liste à cocher avant une sortie publique.

## 1. Essai privé (maintenant)

| Option | Hors ligne sur téléphone | Accès | Coût |
|---|---|---|---|
| Serveur local (`npm start`) | Non (HTTP) | Même wifi | 0 € |
| Cloudflare Pages + Cloudflare Access | Oui (HTTPS) | Adresses e-mail autorisées | 0 € jusqu'à 50 personnes |
| GitHub Pages | Oui (HTTPS) | Public, sauf offre payante | 0 € |

## 2. Avant une sortie publique

- [ ] **Nom** : chercher « Invadoku » dans les bases de marques (INPI pour la France, EUIPO pour l'Europe, WIPO Global Brand Database). « Space Invaders » est une marque de Taito ; le préfixe « Invad- » s'en approche.
- [ ] **Domaine** : réserver le nom de domaine retenu.
- [ ] **Graphismes** : sprites dessinés pour ce jeu. Les garder distincts de ceux de Space Invaders.
- [ ] **Polices** : licence SIL OFL 1.1, fichiers de licence dans `fonts/`. Rien d'autre à faire.
- [ ] **Confidentialité** : le jeu ne collecte rien et ne contacte aucun serveur. Rédiger une page courte qui le dit (exigée par les stores).
- [ ] **Accessibilité** : vérifier la lisibilité des couleurs de zones pour les daltoniens (ajouter un motif par zone si besoin).
- [x] **Langues** : français et anglais (`js/i18n.js`, phrases des indices dans `js/hints.js`). Le manifeste (nom, description) reste en français.

## 3. Stores (plus tard)

Emballer le même code avec Capacitor :

| Store | Compte | Outil |
|---|---|---|
| Google Play | 25 $ une fois | Android Studio |
| App Store | 99 $/an | Mac + Xcode |

Étapes : `npm i @capacitor/core @capacitor/cli`, `npx cap init Invadoku`, `npx cap add android` / `ios`, copier les fichiers web, générer les icônes aux formats des stores.
