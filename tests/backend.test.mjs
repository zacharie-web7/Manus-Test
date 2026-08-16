import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';

import { createApp } from '../server/src/app.ts';

async function withTestServer(run) {
  const server = createApp().listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  assert.ok(address && typeof address === 'object');

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
}

test('GET /health répond avec HTTP 200', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
  });
});

test('GET /health renvoie le JSON attendu', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/health`);

    assert.match(response.headers.get('content-type') ?? '', /^application\/json\b/);
    assert.deepEqual(await response.json(), { status: 'ok' });
  });
});

test('une route inconnue renvoie une erreur JSON 404', async () => {
  await withTestServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/route-inconnue`);

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: {
        code: 'not_found',
        message: 'Route not found',
      },
    });
  });
});
