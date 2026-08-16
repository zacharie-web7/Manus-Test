const DEFAULT_PORT = 3000;

export interface AppConfig {
  port: number;
}

export function readConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const rawPort = environment.PORT?.trim();
  const port = rawPort ? Number(rawPort) : DEFAULT_PORT;

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return { port };
}
