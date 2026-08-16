# Yooza Avis

Yooza Avis V1 est une SPA HTML/CSS/JavaScript vanilla destinée au suivi local et simulé des demandes d'avis après intervention.

## Lancer la V1

Depuis la racine du dépôt :

```powershell
python -m http.server 8000 --directory yooza-avis
```

Puis ouvrir `http://localhost:8000/#/dashboard`.

Un serveur local est recommandé : l'ouverture directe de `index.html` ne permet pas de tester correctement le service worker.

## Lancer les tests

Les tests utilisent uniquement le runner intégré à Node.js, sans installation ni dépendance :

```powershell
node --test "tests/*.test.cjs"
```

Node.js est utilisé uniquement comme exécuteur de tests. L'application reste une SPA statique sans backend Node.

Les tests couvrent :

- logique métier et KPI ;
- dashboard, clients, fiche client, réglages et route inconnue ;
- recherche, filtre et tri ;
- transitions simulées des statuts ;
- lecture, écriture, rechargement et corruption de `localStorage` ;
- réglages et aperçu du message ;
- neutralisation des formules dans le CSV ;
- manifeste, icônes et APP_SHELL PWA ;
- exclusion des futures routes privées du cache.

## Documentation

- [Baseline fonctionnel V1](docs/v1-baseline.md)
- [Documentation détaillée de la V1](yooza-avis/README.md)
- [Notes de validation PWA](yooza-avis/PWA_TEST_NOTES.md)

## Limites volontaires de la V1

- données de démonstration dans `localStorage` ;
- aucun backend ni base de données ;
- aucune authentification ;
- aucun appel Teamleader ;
- aucun envoi réel d'e-mail, SMS ou WhatsApp ;
- aucune connexion Google Business Profile ;
- le délai d'envoi est enregistré mais pas appliqué ;
- les tests DOM ne remplacent pas une validation visuelle dans un vrai navigateur.
