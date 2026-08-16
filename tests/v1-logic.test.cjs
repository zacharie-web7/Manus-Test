const assert = require('node:assert/strict');
const test = require('node:test');

const { createHarness } = require('./helpers/v1-harness.cjs');

test('les données de démonstration conservent les KPI de référence', () => {
  const app = createHarness();
  app.evaluate('initAppState()');

  const stats = JSON.parse(app.evaluate('JSON.stringify(computeStats(AppState.clients))'));
  assert.deepEqual(stats, {
    enAttente: 4,
    envoyes: 2,
    recus: 4,
    noteMoyenne: '4.8',
  });
});

test('les trois statuts métier et leurs libellés restent stables', () => {
  const app = createHarness();
  const statuses = JSON.parse(app.evaluate('JSON.stringify(STATUS)'));
  const labels = JSON.parse(app.evaluate('JSON.stringify(STATUS_LABELS)'));

  assert.deepEqual(statuses, {
    TO_SEND: 'a_envoyer',
    SENT: 'envoye',
    RECEIVED: 'avis_recu',
  });
  assert.equal(labels.a_envoyer, 'À envoyer');
  assert.equal(labels.envoye, 'Envoyé');
  assert.equal(labels.avis_recu, 'Avis reçu');
});

test('la génération de message conserve les variables V1', () => {
  const app = createHarness();
  app.evaluate('initAppState()');

  const message = app.evaluate('generateMessage(AppState.clients[0], AppState.settings)');
  assert.match(message, /^Bonjour Martin,/);
  assert.match(message, /Installation climatisation/);
  assert.match(message, /28\/07\/2026/);
  assert.match(message, /VOTRE_CODE_GOOGLE_AVIS/);
});

test('le bouton d’envoi reste simulé et persiste le statut envoye', () => {
  const app = createHarness();
  app.evaluate('initAppState(); confirmSend(1)');

  const client = JSON.parse(
    app.evaluate('JSON.stringify(AppState.clients.find(client => client.id === 1))')
  );
  const persisted = JSON.parse(app.localStorage.getItem('yooza_clients'));

  assert.equal(client.statut, 'envoye');
  assert.match(client.dateEnvoi, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(persisted.find(item => item.id === 1).statut, 'envoye');
  assert.equal(app.url.created.length, 0, 'aucun appel ou fichier externe ne simule un envoi');
});

test('un avis reçu simulé conserve la note et la date', () => {
  const app = createHarness();
  app.evaluate('initAppState()');
  app.element('note-value').value = '4';
  app.evaluate('confirmReceived(2)');

  const client = JSON.parse(
    app.evaluate('JSON.stringify(AppState.clients.find(client => client.id === 2))')
  );
  assert.equal(client.statut, 'avis_recu');
  assert.equal(client.noteGoogle, 4);
  assert.match(client.dateAvis, /^\d{4}-\d{2}-\d{2}$/);
});

test('les réglages et l’aperçu restent fonctionnels', () => {
  const app = createHarness();
  app.evaluate('initAppState(); renderSettings(document.getElementById("page-content"))');

  app.element('lien-google').value = 'https://example.test/review';
  app.element('delai-envoi').value = '3';
  app.element('modele-message').value = 'Bonjour {prenom} — {lien_google_avis}';
  app.document.selectedChannel = 'sms';

  app.evaluate('updatePreview(); saveSettingsForm()');
  const settings = JSON.parse(app.evaluate('JSON.stringify(AppState.settings)'));
  const persisted = JSON.parse(app.localStorage.getItem('yooza_settings'));

  assert.deepEqual(settings, {
    lienGoogleAvis: 'https://example.test/review',
    delaiEnvoi: 3,
    canal: 'sms',
    modeleMessage: 'Bonjour {prenom} — {lien_google_avis}',
  });
  assert.deepEqual(persisted, settings);
  assert.equal(
    app.element('message-preview-live').textContent,
    'Bonjour Marie — https://example.test/review'
  );
});

test('l’export CSV neutralise les formules sans changer le séparateur', async () => {
  const app = createHarness();
  app.evaluate('initAppState()');

  const dangerousValues = ['=2+2', '+cmd', '-10+20', '@SUM(A1:A2)', '  =HYPERLINK("x")'];
  for (const value of dangerousValues) {
    app.context.__csvValue = value;
    const sanitized = app.evaluate('sanitizeCsvValue(__csvValue)');
    assert.ok(sanitized.startsWith("'"), `la valeur doit être neutralisée : ${value}`);
  }

  app.evaluate('AppState.clients[0].nom = "=2+2"; exportCSV()');
  assert.equal(app.url.created.length, 1);
  const csv = await app.url.created[0].blob.text();
  assert.match(csv, /"'=2\+2"/);
  assert.match(csv, /"Nom";"Entreprise";"Téléphone";"Email"/);
  assert.equal(app.url.revoked.length, 1);
});
