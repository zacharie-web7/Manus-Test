# YOOZA OS — Yooza Avis

Ce dépôt public héberge le frontend et la PWA du module **Yooza Avis**, premier module de la plateforme YOOZA OS.

L'interface reste volontairement nommée Yooza Avis. Les autres modules envisagés pour YOOZA OS ne font pas partie du périmètre actuel.

## Application publique

Yooza Avis est accessible sur GitHub Pages :

<https://zacharie-web7.github.io/yooza-os/>

Le dossier `yooza-avis/` contient une SPA HTML/CSS/JavaScript vanilla installable comme PWA. Cette version utilise encore des données locales simulées dans `localStorage` ; aucun envoi réel n'est effectué.

## Exécution locale

Depuis la racine du dépôt :

```powershell
python -m http.server 8000 --directory yooza-avis
```

Puis ouvrir `http://localhost:8000/#/dashboard`.

Un serveur local est nécessaire pour tester correctement le service worker.

## Tests frontend

Avec Node.js 22.18.0 ou plus récent :

```powershell
npm ci --ignore-scripts
npm test
```

Les tests couvrent la navigation, le stockage local, la logique métier simulée, le responsive et la PWA.

## Séparation du backend

Le backend Node.js/TypeScript, le modèle PostgreSQL, les migrations et les tests SQL ont été transférés vers le dépôt privé `zacharie-web7/yooza-os-backend`.

Leur retrait de ce dépôt public ne supprime pas l'historique : ils restent accessibles dans les commits antérieurs, notamment dans le merge `92c6f5bb78fdbbcc9b1bbaf740bf0f92df724b8c`. Aucun historique Git n'a été réécrit.

## Sécurité

Ce dépôt public ne doit contenir aucun secret, token, identifiant OAuth, URL PostgreSQL réelle, donnée client ou export Teamleader. Les futures connexions sensibles seront exclusivement gérées par le backend privé et leurs secrets resteront hors de Git.

## Documentation

- [Baseline fonctionnelle V1](docs/v1-baseline.md)
- [Documentation détaillée de la PWA](yooza-avis/README.md)
- [Notes de validation PWA](yooza-avis/PWA_TEST_NOTES.md)
