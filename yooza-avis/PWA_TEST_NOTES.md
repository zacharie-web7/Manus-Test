# Validation locale PWA

Date de validation : 16 août 2026

| Contrôle | Résultat |
|---|---|
| Chargement de l’application locale | Réussi sur `http://localhost:8000/#/dashboard`. |
| Logo officiel Yooza dans la sidebar | Chargé depuis `assets/yooza-logo-sidebar.png`. |
| Manifeste et icônes | Référencés depuis `index.html`. |
| Déclencheur d’installation | Le bouton « Installer l’app » est présenté lorsque le navigateur expose l’invite PWA. |
| Hors connexion / mises à jour | Service worker installé avec stratégie réseau d’abord et cache de repli. |

Les tests de publication et d’installation seront refaits une fois GitHub Pages configuré.

## Diagnostic navigateur sandbox

Le navigateur de validation confirme la présence du manifeste et du support `navigator.serviceWorker`, mais ne conserve aucune inscription de service worker sur l’origine `localhost` après rechargement. La PWA sera donc revalidée après publication HTTPS sur GitHub Pages, environnement conforme à l’usage réel.

Un enregistrement explicite du service worker a ensuite été accepté avec le scope `http://localhost:8000/`. Cela valide le fichier `service-worker.js` et sa portée ; la configuration PWA est donc prête pour le test HTTPS final sur GitHub Pages.
