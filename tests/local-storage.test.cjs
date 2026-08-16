const assert = require('node:assert/strict');
const test = require('node:test');

const { FakeLocalStorage, createHarness } = require('./helpers/v1-harness.cjs');

test('sans stockage, la V1 initialise dix clients et les réglages par défaut', () => {
  const app = createHarness();
  app.evaluate('initAppState()');

  assert.equal(app.evaluate('AppState.clients.length'), 10);
  assert.equal(app.evaluate('AppState.settings.delaiEnvoi'), 2);
  assert.equal(app.evaluate('AppState.settings.canal'), 'email');
});

test('un état local valide est lu au démarrage', () => {
  const storedClients = [{ id: 42, nom: 'Client local', statut: 'envoye' }];
  const storedSettings = {
    lienGoogleAvis: 'https://example.test/review',
    delaiEnvoi: 5,
    canal: 'sms',
    modeleMessage: 'Test',
  };
  const app = createHarness({
    storage: {
      yooza_clients: JSON.stringify(storedClients),
      yooza_settings: JSON.stringify(storedSettings),
    },
  });

  app.evaluate('initAppState()');
  assert.equal(app.evaluate('AppState.clients[0].id'), 42);
  assert.equal(app.evaluate('AppState.settings.canal'), 'sms');
});

test('les écritures survivent à un nouveau chargement', () => {
  const storage = new FakeLocalStorage();
  const firstLoad = createHarness({ localStorage: storage });
  firstLoad.evaluate('initAppState(); AppState.clients[0].statut = STATUS.SENT; saveClients()');
  firstLoad.evaluate('AppState.settings.canal = "whatsapp"; saveSettings()');

  const secondLoad = createHarness({ localStorage: storage });
  secondLoad.evaluate('initAppState()');

  assert.equal(secondLoad.evaluate('AppState.clients[0].statut'), 'envoye');
  assert.equal(secondLoad.evaluate('AppState.settings.canal'), 'whatsapp');
});

test('un JSON clients corrompu ne bloque plus l’application', () => {
  const app = createHarness({ storage: { yooza_clients: '{json-invalide' } });

  assert.doesNotThrow(() => app.evaluate('initApp()'));
  assert.equal(app.evaluate('AppState.clients.length'), 10);
  assert.equal(app.localStorage.getItem('yooza_clients'), null);
  assert.ok(app.warnings.some(message => message.includes('yooza_clients')));
});

test('un JSON réglages corrompu ne bloque plus l’application', () => {
  const app = createHarness({ storage: { yooza_settings: '[json-invalide' } });

  assert.doesNotThrow(() => app.evaluate('initAppState()'));
  assert.equal(app.evaluate('AppState.settings.canal'), 'email');
  assert.equal(app.localStorage.getItem('yooza_settings'), null);
  assert.ok(app.warnings.some(message => message.includes('yooza_settings')));
});

test('une structure locale du mauvais type revient aux valeurs par défaut', () => {
  const app = createHarness({
    storage: {
      yooza_clients: JSON.stringify({ pas: 'un tableau' }),
      yooza_settings: JSON.stringify(['pas', 'un', 'objet']),
    },
  });

  app.evaluate('initAppState()');
  assert.equal(app.evaluate('AppState.clients.length'), 10);
  assert.equal(app.evaluate('AppState.settings.canal'), 'email');
});
