import { createApp } from './app.ts';
import { readConfig } from './config.ts';

const config = readConfig();
const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Yooza Avis backend listening on http://localhost:${config.port}`);
});

server.on('error', (error) => {
  const message = error instanceof Error ? error.message : 'Unknown server error';
  console.error('Unable to start Yooza Avis backend:', message);
  process.exitCode = 1;
});
