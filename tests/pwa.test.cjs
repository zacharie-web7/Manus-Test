const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const { APP_ROOT } = require('./helpers/v1-harness.cjs');

function pngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function loadServiceWorker() {
  const listeners = new Map();
  const self = {
    location: new URL('https://example.test/Manus-Test/service-worker.js'),
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    skipWaiting() {
      return Promise.resolve();
    },
    clients: {
      claim() {
        return Promise.resolve();
      },
    },
  };
  const context = vm.createContext({
    URL,
    Response,
    self,
    fetch() {
      return Promise.reject(new Error('le réseau ne doit pas être utilisé par ce test'));
    },
    caches: {
      open() {
        return Promise.resolve({ addAll() {}, put() {} });
      },
      keys() {
        return Promise.resolve([]);
      },
      delete() {
        return Promise.resolve(true);
      },
      match() {
        return Promise.resolve(undefined);
      },
    },
  });
  const source = fs.readFileSync(path.join(APP_ROOT, 'service-worker.js'), 'utf8');
  vm.runInContext(source, context, { filename: 'service-worker.js' });
  return { context, listeners };
}

test('le manifeste PWA est valide et référence des icônes présentes', () => {
  const manifestPath = path.join(APP_ROOT, 'manifest.webmanifest');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.equal(manifest.start_url, './#/dashboard');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.ok(Array.isArray(manifest.icons));
  assert.ok(manifest.icons.length >= 3);

  const iconEntries = [
    ...manifest.icons,
    ...manifest.shortcuts.flatMap(shortcut => shortcut.icons || []),
  ];
  for (const icon of iconEntries) {
    const iconPath = path.join(APP_ROOT, icon.src);
    assert.equal(fs.existsSync(iconPath), true, `icône manquante : ${icon.src}`);
    const [expectedWidth, expectedHeight] = icon.sizes.split('x').map(Number);
    const actual = pngDimensions(iconPath);
    assert.deepEqual(actual, { width: expectedWidth, height: expectedHeight });
  }
});

test('toutes les ressources APP_SHELL existent', () => {
  const { context } = loadServiceWorker();
  const appShell = JSON.parse(vm.runInContext('JSON.stringify(APP_SHELL)', context));

  assert.ok(appShell.length > 0);
  for (const resource of appShell) {
    const relativePath = resource.replace(/^\.\//, '');
    const target = relativePath ? path.join(APP_ROOT, relativePath) : APP_ROOT;
    assert.equal(fs.existsSync(target), true, `ressource APP_SHELL manquante : ${resource}`);
  }
});

test('les scripts et styles chargés par index.html existent', () => {
  const html = fs.readFileSync(path.join(APP_ROOT, 'index.html'), 'utf8');
  const references = [
    ...html.matchAll(/<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g),
  ]
    .map(match => match[1])
    .filter(reference => !/^https?:/.test(reference));

  assert.ok(references.length > 0);
  for (const reference of references) {
    assert.equal(
      fs.existsSync(path.join(APP_ROOT, reference)),
      true,
      `ressource HTML manquante : ${reference}`
    );
  }
});

test('le service worker ne gère que les assets publics explicitement listés', () => {
  const { context } = loadServiceWorker();
  const shouldHandle = url => {
    context.__request = { method: 'GET', url };
    return vm.runInContext('shouldHandleRequest(__request)', context);
  };

  assert.equal(shouldHandle('https://example.test/Manus-Test/index.html'), true);
  assert.equal(shouldHandle('https://example.test/Manus-Test/js/app.js'), true);
  assert.equal(shouldHandle('https://example.test/Manus-Test/api/clients'), false);
  assert.equal(shouldHandle('https://example.test/Manus-Test/auth/session'), false);
  assert.equal(shouldHandle('https://example.test/Manus-Test/oauth/callback'), false);
  assert.equal(shouldHandle('https://example.test/Manus-Test/callback/oidc'), false);
  assert.equal(shouldHandle('https://other.test/Manus-Test/index.html'), false);
  assert.equal(shouldHandle('https://example.test/Manus-Test/private.json'), false);
});

test('les requêtes non publiques ne sont pas interceptées', () => {
  const { listeners } = loadServiceWorker();
  const fetchHandler = listeners.get('fetch');
  let responded = false;

  fetchHandler({
    request: {
      method: 'GET',
      url: 'https://example.test/Manus-Test/api/clients',
    },
    respondWith() {
      responded = true;
    },
  });

  assert.equal(responded, false);
});
