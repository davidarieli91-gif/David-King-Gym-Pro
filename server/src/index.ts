import { buildApp } from './app';
import { config } from './config';
import { pool } from './db';

async function main(): Promise<void> {
  const app = await buildApp();

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'shutting down');
    await app.close();
    await pool.end();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: config.PORT, host: config.HOST });
  app.log.info(
    { port: config.PORT, host: config.HOST, publicBaseUrl: config.PUBLIC_BASE_URL },
    'David King Gym API ready',
  );
}

main().catch((error) => {
  console.error('failed to start server', error);
  process.exit(1);
});
