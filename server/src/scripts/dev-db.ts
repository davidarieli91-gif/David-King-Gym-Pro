import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = join(__dirname, '..', '..', 'data', 'pg');
const PORT = Number(process.env.DEV_DB_PORT || 55432);
const DATABASE = process.env.DEV_DB_NAME || 'dkg';

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: 'postgres',
    password: 'postgres',
    port: PORT,
    persistent: true,
    authMethod: 'password',
    // Windows defaults to the legacy WIN1251 encoding for Cyrillic locales.
    // The app stores Hebrew/Arabic/emoji, so the dev cluster must be UTF8.
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
  });

  const initialized = existsSync(join(DATA_DIR, 'PG_VERSION'));
  if (!initialized) {
    console.log(`initialising postgres in ${DATA_DIR}`);
    await pg.initialise();
  }

  await pg.start();
  console.log(`postgres running on 127.0.0.1:${PORT}`);

  try {
    await pg.createDatabase(DATABASE);
    console.log(`database "${DATABASE}" created`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/already exists/i.test(message)) {
      console.log(`database "${DATABASE}" already present or could not be created: ${message}`);
    }
  }

  const stop = async () => {
    console.log('stopping postgres');
    await pg.stop();
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  console.log('press Ctrl+C to stop');
  await new Promise(() => undefined);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
