const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(ROOT, 'yooza-avis', 'css', 'style.css'), 'utf8');

function readScript(name) {
  return fs.readFileSync(path.join(ROOT, 'yooza-avis', 'js', name), 'utf8');
}

test('le conteneur principal peut rétrécir dans le layout flex mobile', () => {
  assert.match(css, /\.main-content\s*\{[^}]*min-width:\s*0;/s);
});

test('les grilles principales utilisent des classes responsive', () => {
  const dashboard = readScript('dashboard.js');
  const clientDetail = readScript('client-detail.js');
  const settings = readScript('settings.js');

  assert.match(dashboard, /class="dashboard-main-grid"/);
  assert.equal((clientDetail.match(/class="client-detail-grid"/g) || []).length, 2);
  assert.match(settings, /class="settings-layout"/);
  assert.match(settings, /class="settings-preview"/);

  assert.doesNotMatch(dashboard, /grid-template-columns:1fr 380px/);
  assert.doesNotMatch(clientDetail, /grid-template-columns:1fr 1fr/);
  assert.doesNotMatch(settings, /grid-template-columns:1fr 340px/);
});

test('le breakpoint mobile empile les grilles sans masquer le débordement global', () => {
  assert.match(css, /\.dashboard-main-grid,[\s\S]*\.settings-layout\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);/);
  assert.match(css, /\.table-wrapper\s*\{\s*overflow-x:\s*auto;/);
  assert.doesNotMatch(css, /(?:html|body)\s*\{[^}]*overflow-x:\s*hidden;/s);
});
