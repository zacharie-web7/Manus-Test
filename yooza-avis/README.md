# Yooza Avis — V1

Application web interne permettant à **Yooza SC** de suivre et préparer l'automatisation des demandes d'avis Google après chaque intervention client.

> **Version 1** — Données de démonstration locales uniquement. Aucune API externe connectée.

---

## Aperçu

Yooza Avis centralise le suivi des demandes d'avis Google en trois étapes : **À envoyer → Envoyé → Avis reçu**. L'application offre un tableau de bord en temps réel, une liste clients filtrable, des fiches clients détaillées et une page de réglages pour personnaliser les messages et le canal d'envoi.

L'interface reprend fidèlement l'identité visuelle de [yooza.be](https://yooza.be) : jaune `#FFE861`, noir `#1E1E1C`, fond crème `#F9F9F5`, typographie Roboto.

---

## Lancer le projet

### Méthode 1 — Ouverture directe (la plus simple)

```bash
# Cloner le dépôt
git clone https://github.com/zacharie-web7/Manus-Test.git
cd Manus-Test/yooza-avis

# Ouvrir index.html dans votre navigateur
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

> Aucune installation requise. L'application fonctionne entièrement en local.

### Méthode 2 — Serveur local (recommandé pour éviter les restrictions CORS)

**Avec Python :**
```bash
cd Manus-Test/yooza-avis
python3 -m http.server 8080
# Ouvrir http://localhost:8080
```

**Avec Node.js :**
```bash
npx serve .
# Ouvrir l'URL affichée dans le terminal
```

**Avec VS Code :**
Installer l'extension **Live Server**, clic droit sur `index.html` → *Open with Live Server*.

---

## Structure des fichiers

```
yooza-avis/
├── index.html                 # Point d'entrée SPA — structure HTML, sidebar, topbar, modal
├── css/
│   └── style.css              # Styles globaux — variables Yooza, composants, responsive
├── js/
│   ├── data.js                # Données de démonstration + fonctions utilitaires
│   ├── app.js                 # Routeur SPA hash-based + état global + toast + modal
│   ├── dashboard.js           # Tableau de bord (KPIs, activité récente, envois rapides)
│   ├── clients.js             # Liste clients (filtres, recherche, export CSV)
│   ├── client-detail.js       # Fiche client (timeline, bouton envoi, marquer avis reçu)
│   └── settings.js            # Page réglages (lien Google, délai, canal, modèle message)
├── assets/
│   ├── yooza-logo.png         # Logo Yooza (téléchargé depuis yooza.be)
│   └── brand-identity.md      # Documentation de l'identité visuelle extraite
└── README.md                  # Ce fichier
```

---

## Fonctionnalités V1

| Fonctionnalité | Statut |
|---|---|
| Tableau de bord avec 4 KPIs | ✅ |
| Liste clients avec filtres et recherche | ✅ |
| Export CSV de la liste clients | ✅ |
| Fiche client détaillée | ✅ |
| Timeline de progression (3 étapes) | ✅ |
| Bouton "Envoyer une demande d'avis" | ✅ |
| Modal de confirmation d'envoi | ✅ |
| Marquer un avis comme reçu avec note | ✅ |
| Page Réglages complète | ✅ |
| Sélection du canal (Email / SMS / WhatsApp) | ✅ |
| Modèle de message personnalisable | ✅ |
| Prévisualisation du message en temps réel | ✅ |
| Persistance des données (localStorage) | ✅ |
| Interface responsive (mobile + desktop) | ✅ |
| Identité visuelle Yooza (jaune/noir/crème) | ✅ |

---

## Identité visuelle

L'application reprend l'ADN graphique de [yooza.be](https://yooza.be) :

| Élément | Valeur |
|---|---|
| Couleur primaire (jaune Yooza) | `#FFE861` |
| Couleur secondaire (noir) | `#1E1E1C` |
| Fond général (crème) | `#F9F9F5` |
| Surface (blanc) | `#FFFFFF` |
| Typographie corps | Roboto, sans-serif |
| Typographie titres | Arial, sans-serif |
| Border-radius boutons | 15px |
| Style général | Flat design, fort contraste |

---

## Données de démonstration

Le fichier `js/data.js` contient 10 clients fictifs couvrant tous les statuts possibles :

- 4 clients **À envoyer** (en attente d'une demande d'avis)
- 2 clients **Envoyé** (demande envoyée, avis non encore reçu)
- 4 clients **Avis reçu** (avec notes Google de 4 à 5 étoiles)

Les données sont persistées dans le `localStorage` du navigateur. Pour réinitialiser aux données de démonstration, ouvrir la console du navigateur et exécuter :

```javascript
localStorage.clear();
location.reload();
```

---

## Roadmap — Connexions V2

### Teamleader CRM

Teamleader expose une API REST OAuth2 permettant de récupérer automatiquement les interventions terminées.

**Étapes d'intégration :**

1. Créer une application dans [Teamleader Marketplace](https://marketplace.teamleader.eu)
2. Implémenter le flux OAuth2 (authorization code flow)
3. Appeler l'endpoint `GET /deals` ou `GET /events` pour récupérer les interventions
4. Mapper les champs Teamleader vers le modèle `DEMO_CLIENTS` de `data.js`
5. Mettre en place un webhook ou un polling pour la synchronisation automatique

**Variables d'environnement nécessaires :**
```
TEAMLEADER_CLIENT_ID=...
TEAMLEADER_CLIENT_SECRET=...
TEAMLEADER_REDIRECT_URI=...
```

### Google Business Profile API

L'API Google Business Profile permet d'envoyer des invitations à laisser un avis et de récupérer les avis reçus.

**Étapes d'intégration :**

1. Activer l'API *Business Profile Performance API* dans Google Cloud Console
2. Configurer OAuth2 avec les scopes `https://www.googleapis.com/auth/business.manage`
3. Utiliser l'endpoint `accounts.locations.reviews.list` pour récupérer les avis
4. Utiliser le lien court généré par Google Business Profile pour les invitations
5. Mettre en place un webhook ou un polling pour détecter les nouveaux avis

**Variables d'environnement nécessaires :**
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_BUSINESS_ACCOUNT_ID=...
```

### Canaux d'envoi

| Canal | Service recommandé | Documentation |
|---|---|---|
| Email | Mailchimp Transactional / SendGrid | API REST standard |
| SMS | Twilio / Vonage | API REST + webhooks |
| WhatsApp | WhatsApp Business API (Meta) | Cloud API officielle |

---

## Notes techniques

L'application est une **SPA (Single Page Application) statique** sans dépendance serveur ni framework JavaScript. La navigation est gérée par un routeur hash-based (`#/dashboard`, `#/clients`, `#/client/:id`, `#/settings`). L'état de l'application est persisté dans le `localStorage` du navigateur.

Pour une V2 avec backend, il est recommandé d'adopter une architecture **Node.js + Express** (ou équivalent) avec une base de données relationnelle (PostgreSQL) pour stocker les clients, les envois et les avis de manière pérenne.

---

## Licence

Usage interne Yooza SC — Tous droits réservés.
