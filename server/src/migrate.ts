import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PoolClient } from 'pg';
import { pool } from './db';

const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

export async function runMigrations(): Promise<string[]> {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const client = await pool.connect();
  const applied: string[] = [];
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const result = await client.query<{ version: string }>('SELECT version FROM schema_migrations');
    const done = new Set(result.rows.map((row) => row.version));

    for (const file of files) {
      if (done.has(file)) continue;
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
      await applyMigration(client, file, sql);
      applied.push(file);
    }
  } finally {
    client.release();
  }

  return applied;
}

async function applyMigration(client: PoolClient, version: string, sql: string): Promise<void> {
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
    await client.query('COMMIT');
    console.log(`migration applied: ${version}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then((applied) => {
      console.log(applied.length ? `applied ${applied.length} migration(s)` : 'database is up to date');
      return pool.end();
    })
    .catch((error) => {
      console.error('migration failed', error);
      process.exitCode = 1;
      return pool.end();
    });
}
