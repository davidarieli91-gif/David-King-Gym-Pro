import 'dotenv/config';
import { Pool } from 'pg';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outDir = process.env.BACKUP_DIR || 'F:\\DKG\\backups\\db';
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const tables = [
  'tenants',
  'users',
  'password_resets',
  'invites',
  'sessions',
  'records',
  'files',
  'portal_tokens',
  'trainer_stats',
  'audit_log',
  'schema_migrations',
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const dump = {
  app: 'david-king-gym',
  format: 1,
  created_at: new Date().toISOString(),
  tables: {},
};

try {
  for (const table of tables) {
    const result = await pool.query(`SELECT * FROM ${table}`);
    dump.tables[table] = result.rows;
    console.log(`${table}: ${result.rowCount}`);
  }

  await mkdir(outDir, { recursive: true });
  const file = join(outDir, `dkg-${stamp}.json`);
  await writeFile(file, JSON.stringify(dump), 'utf8');
  console.log(`backup written: ${file}`);
} finally {
  await pool.end();
}
