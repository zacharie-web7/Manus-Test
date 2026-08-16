# Yooza Avis

Le dépôt contient deux couches indépendantes :

- `yooza-avis/` : la V1, une SPA HTML/CSS/JavaScript vanilla avec des données locales simulées ;
- `server/` : la fondation backend V2, une API REST Node.js/TypeScript minimale.

## Prérequis

- Node.js 22.18 ou plus récent ;
- npm.

Sous Windows, si PowerShell bloque `npm.ps1`, les mêmes commandes fonctionnent avec `npm.cmd`.

## Installer les dépendances

Depuis la racine du dépôt :

```powershell
npm install
```

L'installation ajoute Express pour le serveur et les outils TypeScript nécessaires au développement. Aucun service externe n'est configuré par l'application.

## Lancer le backend V2

Copier facultativement `.env.example` vers `.env`, puis adapter `PORT`. Si `.env` est absent, le port `3000` est utilisé.

```powershell
npm run dev
```

Vérifier ensuite le serveur :

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Réponse attendue :

```json
{
  "status": "ok"
}
```

Le mode compilé utilise :

```powershell
npm run build
npm start
```

## Scripts npm

- `npm run dev` : démarre le serveur TypeScript local et le relance après une modification.
- `npm run build` : compile `server/src/` vers `dist/`.
- `npm start` : exécute le backend compilé.
- `npm run typecheck` : vérifie les types sans produire de fichiers.
- `npm run test:v1` : exécute les 29 tests de non-régression de la V1.
- `npm run test:backend` : teste le backend HTTP et la structure du modèle PostgreSQL.
- `npm run test:model` : vérifie la structure Drizzle et sa correspondance avec la migration initiale.
- `npm run db:generate` : génère les migrations PostgreSQL sans ouvrir de connexion.
- `npm run db:check` : vérifie la cohérence des migrations Drizzle.
- `npm test` : exécute les tests V1 puis les tests backend.

## Intégration continue

Le workflow `.github/workflows/ci.yml` s'exécute pour chaque pull request vers `main`, chaque push sur `main` et sur demande manuelle. Sous Node 22.18.0 et Node 24, il installe les dépendances depuis le lockfile, puis lance les tests V1 et backend, le typecheck et le build.

Une pull request ne devrait pas être fusionnée si l'un des contrôles CI échoue.

## Lancer la V1 indépendamment

La V1 ne dépend pas du backend. Depuis la racine :

```powershell
python -m http.server 8000 --directory yooza-avis
```

Puis ouvrir `http://localhost:8000/#/dashboard`.

Un serveur local est recommandé : l'ouverture directe de `index.html` ne permet pas de tester correctement le service worker.

## Ce qui existe dans le backend

- une application Express créée séparément du processus d'écoute ;
- `GET /health` avec une réponse JSON `200` ;
- une réponse JSON `404` pour les routes inconnues ;
- une réponse JSON générique `500`, sans stack trace envoyée au client ;
- une configuration stricte et minimale de `PORT` ;
- des tests HTTP automatisés sans base de données.
- un modèle PostgreSQL Drizzle et une migration initiale non encore appliquée à un moteur réel.

## Ce qui n'existe volontairement pas encore

- aucune base PostgreSQL connectée et aucune migration appliquée à un moteur réel ;
- aucune authentification ;
- aucun code ou OAuth Teamleader ;
- aucune connexion Google Business Profile ;
- aucun envoi d'e-mail, SMS ou WhatsApp ;
- aucun secret, token ou identifiant client ;
- aucun React, tRPC, Docker, Redis, queue ou microservice.

## Documentation V1

- [Modèle de données V2](docs/data-model.md)
- [Baseline fonctionnel V1](docs/v1-baseline.md)
- [Documentation détaillée de la V1](yooza-avis/README.md)
- [Notes de validation PWA](yooza-avis/PWA_TEST_NOTES.md)

Les données V1 restent dans `localStorage` et tous les envois y restent simulés.
