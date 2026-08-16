# Baseline fonctionnel Yooza Avis V1

Ce document décrit le comportement de référence observé avant l'évolution vers la V2. Il distingue les fonctions à préserver des anomalies connues. Les corrections de sécurité autorisées pendant l'étape de baseline sont signalées explicitement.

## Parcours et comportements

| Comportement | Référence V1 | Classification | Décision pour cette étape |
|---|---|---|---|
| Ouverture sans hash | Le tableau de bord est rendu. | Comportement attendu | Préserver. |
| Route `#/dashboard` | Affiche les quatre KPI, les interventions récentes et les clients à envoyer. | Comportement attendu | Préserver. |
| Route `#/clients` | Affiche les dix clients de démonstration, triés par date de fin décroissante. | Comportement attendu | Préserver. |
| Route `#/client/:id` | Affiche la fiche, la progression, les coordonnées, l'intervention et le message. | Comportement attendu | Préserver. |
| Route `#/settings` | Affiche le lien Google, le délai, le canal et le modèle de message. | Comportement attendu | Préserver. |
| Route inconnue | Affiche le tableau de bord tout en conservant le hash inconnu. | Comportement à préserver temporairement | Ne pas introduire de page 404 dans cette étape. |
| Données initiales | Charge dix clients fictifs si aucun état valide n'est stocké. | Comportement attendu | Préserver. |
| Recherche | Recherche sans tenir compte de la casse dans le nom, la société, l'e-mail et le type d'intervention. | Comportement attendu | Préserver. |
| Filtre de statut | Filtre sur `a_envoyer`, `envoye` ou `avis_recu`. | Comportement attendu | Préserver. |
| Tri clients | Trie par `dateFinIntervention`, de la plus récente à la plus ancienne. | Comportement attendu | Préserver. |
| Envoi simulé | Passe un client de `a_envoyer` à `envoye`, date l'envoi et persiste l'état. Aucun message réel n'est envoyé. | Comportement attendu et volontairement simulé | Préserver. |
| Avis reçu simulé | Passe un client à `avis_recu`, enregistre la date et la note. | Comportement attendu et volontairement simulé | Préserver. |
| Persistance | Les clients et réglages sont stockés sous `yooza_clients` et `yooza_settings`. | Comportement à préserver temporairement | L'architecture `localStorage` ne change pas encore. |
| JSON local invalide | Avant correction, une valeur JSON malformée arrêtait l'initialisation. | Anomalie connue | Corrigée dans cette étape par retour aux données par défaut. |
| Réglages | Le lien, le délai, le canal et le modèle sont sauvegardés localement. | Comportement attendu | Préserver. |
| Délai d'envoi | La valeur est sauvegardée mais n'influence aucun calcul ni envoi. | Anomalie connue | À corriger ultérieurement ; hors périmètre. |
| Aperçu du message | Remplace les variables avec le client fictif Marie Dupont. | Comportement attendu | Préserver. |
| Variables répétées | Seule la première occurrence de chaque variable est remplacée. | Anomalie connue | À corriger ultérieurement ; hors périmètre. |
| Export CSV | Exporte la liste filtrée en UTF-8, séparateur point-virgule. | Comportement attendu | Préserver le format et neutraliser les formules de tableur. |
| Données injectées dans le DOM | Plusieurs valeurs locales étaient insérées directement avec `innerHTML`. | Anomalie de sécurité | Corrigée de façon ciblée dans cette étape. |
| Manifeste PWA | Décrit l'application, son démarrage, son scope, ses icônes et raccourcis. | Comportement attendu | Valider automatiquement. |
| Service worker | Précharge l'APP_SHELL puis applique une stratégie réseau d'abord. | Comportement attendu | Préserver pour les assets publics seulement. |
| Cache futur `/api` et `/auth` | Avant correction, tout GET de même origine pouvait être mis en cache. | Anomalie de sécurité future | Corrigée par liste blanche des assets publics. |
| Responsive | Certaines grilles définies inline restent trop larges sur petit écran. | Anomalie connue | Refonte hors périmètre. |

## Ce que les tests automatisés couvrent

- calcul des KPI et génération du message ;
- initialisation, lecture, écriture et rechargement de `localStorage` ;
- récupération après JSON local invalide ;
- routes dashboard, clients, fiche client, réglages et route inconnue ;
- recherche, filtre et tri ;
- transitions simulées `a_envoyer`, `envoye` et `avis_recu` ;
- sauvegarde des réglages et aperçu ;
- neutralisation CSV ;
- validité du manifeste et présence de ses icônes ;
- intégrité de l'APP_SHELL ;
- exclusion des routes privées futures du cache.

## Limites des tests

Le harness DOM est volontairement minimal et sans dépendance. Il vérifie les contrats de rendu, la navigation et les mutations d'état, mais ne remplace pas un vrai navigateur pour :

- le calcul CSS et les débordements responsive ;
- l'installation PWA réelle ;
- le cycle complet du service worker dans Chromium/Safari ;
- l'accessibilité clavier et lecteur d'écran ;
- le téléchargement final du CSV par chaque navigateur.

Ces contrôles restent dans la checklist manuelle avant publication.
