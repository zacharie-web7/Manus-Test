/**
 * data.js — Données de démonstration Yooza Avis V1
 * --------------------------------------------------
 * Fichier de données fictives uniquement.
 * Aucune donnée réelle, aucune clé API.
 * En V2, remplacer par des appels à l'API Teamleader.
 */

'use strict';

// ---------------------------------------------------------------------------
// Constantes de statut
// ---------------------------------------------------------------------------
const STATUS = {
  TO_SEND:  'a_envoyer',
  SENT:     'envoye',
  RECEIVED: 'avis_recu',
};

const STATUS_LABELS = {
  [STATUS.TO_SEND]:  'À envoyer',
  [STATUS.SENT]:     'Envoyé',
  [STATUS.RECEIVED]: 'Avis reçu',
};

const STATUS_BADGE_CLASS = {
  [STATUS.TO_SEND]:  'warning',
  [STATUS.SENT]:     'info',
  [STATUS.RECEIVED]: 'success',
};

// ---------------------------------------------------------------------------
// Données clients de démonstration
// ---------------------------------------------------------------------------
const DEMO_CLIENTS = [
  {
    id: 1,
    nom: 'Martin Dupont',
    telephone: '06 12 34 56 78',
    email: 'martin.dupont@example.com',
    entreprise: 'Boulangerie Dupont',
    typeIntervention: 'Installation climatisation',
    dateFinIntervention: '2026-07-28',
    technicien: 'Samuel Dulieu',
    adresse: '12 rue des Lilas, 4500 Huy',
    notes: 'Installation split 9000 BTU — client très satisfait sur place.',
    statut: STATUS.TO_SEND,
    dateEnvoi: null,
    dateAvis: null,
    noteGoogle: null,
  },
  {
    id: 2,
    nom: 'Sophie Lefebvre',
    telephone: '07 23 45 67 89',
    email: 'sophie.lefebvre@example.com',
    entreprise: 'Cabinet Lefebvre & Associés',
    typeIntervention: 'Maintenance préventive',
    dateFinIntervention: '2026-07-25',
    technicien: 'Samuel Dulieu',
    adresse: '45 avenue Jean Jaurès, 4000 Liège',
    notes: 'Maintenance annuelle — filtre remplacé, fluide complété.',
    statut: STATUS.SENT,
    dateEnvoi: '2026-07-27',
    dateAvis: null,
    noteGoogle: null,
  },
  {
    id: 3,
    nom: 'Pierre Rousseau',
    telephone: '06 34 56 78 90',
    email: 'pierre.rousseau@example.com',
    entreprise: 'Restaurant Le Provençal',
    typeIntervention: 'Dépannage froid',
    dateFinIntervention: '2026-07-20',
    technicien: 'Samuel Dulieu',
    adresse: '8 place du Marché, 5000 Namur',
    notes: 'Remplacement thermostat chambre froide — intervention urgente.',
    statut: STATUS.RECEIVED,
    dateEnvoi: '2026-07-22',
    dateAvis: '2026-07-24',
    noteGoogle: 5,
  },
  {
    id: 4,
    nom: 'Isabelle Garnier',
    telephone: '07 45 67 89 01',
    email: 'isabelle.garnier@example.com',
    entreprise: 'Pharmacie Garnier',
    typeIntervention: 'Installation pompe à chaleur',
    dateFinIntervention: '2026-07-18',
    technicien: 'Samuel Dulieu',
    adresse: '23 rue de la République, 4500 Huy',
    notes: 'PAC air/eau 12 kW — mise en service complète.',
    statut: STATUS.RECEIVED,
    dateEnvoi: '2026-07-20',
    dateAvis: '2026-07-23',
    noteGoogle: 5,
  },
  {
    id: 5,
    nom: 'François Petit',
    telephone: '06 56 78 90 12',
    email: 'francois.petit@example.com',
    entreprise: 'Hôtel du Parc',
    typeIntervention: 'Entretien VMC',
    dateFinIntervention: '2026-08-01',
    technicien: 'Samuel Dulieu',
    adresse: '67 boulevard de la Sauvenière, 4000 Liège',
    notes: 'Nettoyage complet VMC double flux — 3 unités.',
    statut: STATUS.TO_SEND,
    dateEnvoi: null,
    dateAvis: null,
    noteGoogle: null,
  },
  {
    id: 6,
    nom: 'Nathalie Blanc',
    telephone: '07 67 89 01 23',
    email: 'nathalie.blanc@example.com',
    entreprise: 'Clinique Vétérinaire Blanc',
    typeIntervention: 'Mise en service groupe froid',
    dateFinIntervention: '2026-07-30',
    technicien: 'Samuel Dulieu',
    adresse: '14 rue Garibaldi, 4500 Huy',
    notes: 'Groupe froid 20 kW — mise en service et paramétrage.',
    statut: STATUS.TO_SEND,
    dateEnvoi: null,
    dateAvis: null,
    noteGoogle: null,
  },
  {
    id: 7,
    nom: 'Éric Fontaine',
    telephone: '06 78 90 12 34',
    email: 'eric.fontaine@example.com',
    entreprise: 'Supermarché Fontaine',
    typeIntervention: 'Remplacement compresseur',
    dateFinIntervention: '2026-07-15',
    technicien: 'Samuel Dulieu',
    adresse: '89 chaussée de Liège, 5000 Namur',
    notes: 'Compresseur Copeland remplacé — garantie 2 ans.',
    statut: STATUS.RECEIVED,
    dateEnvoi: '2026-07-17',
    dateAvis: '2026-07-19',
    noteGoogle: 4,
  },
  {
    id: 8,
    nom: 'Céline Morel',
    telephone: '07 89 01 23 45',
    email: 'celine.morel@example.com',
    entreprise: 'Studio Morel Architectes',
    typeIntervention: 'Contrôle étanchéité',
    dateFinIntervention: '2026-08-04',
    technicien: 'Samuel Dulieu',
    adresse: '5 rue du Président, 4000 Liège',
    notes: 'Contrôle réglementaire annuel — aucune fuite détectée.',
    statut: STATUS.SENT,
    dateEnvoi: '2026-08-06',
    dateAvis: null,
    noteGoogle: null,
  },
  {
    id: 9,
    nom: 'Laurent Chevalier',
    telephone: '06 90 12 34 56',
    email: 'laurent.chevalier@example.com',
    entreprise: 'Imprimerie Chevalier',
    typeIntervention: 'Installation climatisation',
    dateFinIntervention: '2026-08-05',
    technicien: 'Samuel Dulieu',
    adresse: '31 rue Blandan, 4500 Huy',
    notes: 'Multi-split 4 têtes — installation sur 2 jours.',
    statut: STATUS.TO_SEND,
    dateEnvoi: null,
    dateAvis: null,
    noteGoogle: null,
  },
  {
    id: 10,
    nom: 'Valérie Simon',
    telephone: '07 01 23 45 67',
    email: 'valerie.simon@example.com',
    entreprise: 'Crèche Les Petits Loups',
    typeIntervention: 'Maintenance préventive',
    dateFinIntervention: '2026-07-22',
    technicien: 'Samuel Dulieu',
    adresse: '18 rue Sébastien, 5000 Namur',
    notes: 'Maintenance bi-annuelle — tout conforme.',
    statut: STATUS.RECEIVED,
    dateEnvoi: '2026-07-24',
    dateAvis: '2026-07-26',
    noteGoogle: 5,
  },
];

// ---------------------------------------------------------------------------
// Paramètres de réglages par défaut
// ---------------------------------------------------------------------------
const DEFAULT_SETTINGS = {
  lienGoogleAvis: 'https://g.page/r/VOTRE_CODE_GOOGLE_AVIS/review',
  delaiEnvoi: 2,
  canal: 'email',
  modeleMessage: `Bonjour {prenom},

Nous espérons que vous êtes pleinement satisfait(e) de notre intervention "{type_intervention}" réalisée le {date_intervention}.

Votre avis compte énormément pour nous et aide d'autres clients à nous faire confiance. Pourriez-vous prendre 2 minutes pour laisser un avis Google ?

👉 {lien_google_avis}

Merci de votre confiance,
L'équipe Yooza`,
};

// ---------------------------------------------------------------------------
// Fonctions utilitaires
// ---------------------------------------------------------------------------

function computeStats(clients) {
  const enAttente = clients.filter(c => c.statut === STATUS.TO_SEND).length;
  const envoyes   = clients.filter(c => c.statut === STATUS.SENT).length;
  const recus     = clients.filter(c => c.statut === STATUS.RECEIVED).length;
  const notes     = clients.filter(c => c.noteGoogle !== null).map(c => c.noteGoogle);
  const noteMoyenne = notes.length > 0
    ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1)
    : '—';
  return { enAttente, envoyes, recus, noteMoyenne };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function getClientById(id) {
  return DEMO_CLIENTS.find(c => c.id === Number(id));
}

function generateMessage(client, settings) {
  const prenom = client.nom.split(' ')[0];
  return settings.modeleMessage
    .replace('{prenom}', prenom)
    .replace('{type_intervention}', client.typeIntervention)
    .replace('{date_intervention}', formatDate(client.dateFinIntervention))
    .replace('{lien_google_avis}', settings.lienGoogleAvis);
}

function getInitials(nom) {
  const parts = nom.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return nom.substring(0, 2).toUpperCase();
}

function renderStars(note) {
  if (!note) return '—';
  let html = '<span class="stars">';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="${i <= note ? '' : 'star-empty'}">★</span>`;
  }
  html += '</span>';
  return html;
}
