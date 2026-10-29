import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';

const file = process.argv[2] || process.env.BACKUP_FILE;
if (!file) {
  console.error('Usage: node scripts/restore.mjs path/to/dkg-YYYY-MM-DDTHH-MM-SS.json');
  process.exit(1);
}
if (process.env.RESTORE_CONFIRM !== 'yes') {
  console.error('Refusing to overwrite the database. Set RESTORE_CONFIRM=yes to continue.');
  process.exit(1);
}

const dump = JSON.parse(await readFile(file, 'utf8'));
if (!dump || dump.app !== 'david-king-gym' || !dump.tables) {
  console.error('This is not a David King Gym backup file.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

async function insertRows(table, rows) {
  if (!rows || !rows.length) return;
  const columns = Object.keys(rows[0]);
  const quoted = columns.map((column) => `"${column}"`).join(', ');
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  for (const row of rows) {
    const values = columns.map((column) => {
      const value = row[column];
      if (value && typeof value === 'object') return JSON.stringify(value);
      return value;
    });
    await client.query(`INSERT INTO ${table} (${quoted}) VALUES (${placeholders})`, values);
  }
}

try {
  await client.query('BEGIN');
  await client.query('ALTER TABLE records DISABLE ROW LEVEL SECURITY');
  await client.query('ALTER TABLE files DISABLE ROW LEVEL SECURITY');
  await client.query(`
    TRUNCATE TABLE
      audit_log,
      portal_tokens,
      files,
      records,
      trainer_stats,
      password_resets,
      invites,
      users,
      tenants
    RESTART IDENTITY CASCADE
  `);

  const tenants = dump.tables.tenants || [];
  await insertRows('tenants', tenants.map((tenant) => ({ ...tenant, owner_user_id: null })));
  await insertRows('users', dump.tables.users || []);
  for (const tenant of tenants) {
    if (tenant.owner_user_id) {
      await client.query('UPDATE tenants SET owner_user_id = $1 WHERE id = $2', [tenant.owner_user_id, tenant.id]);
    }
  }
  await insertRows('password_resets', dump.tables.password_resets || []);
  await insertRows('invites', dump.tables.invites || []);
  await insertRows('records', dump.tables.records || []);
  await insertRows('files', dump.tables.files || []);
  await insertRows('portal_tokens', dump.tables.portal_tokens || []);
  await insertRows('trainer_stats', dump.tables.trainer_stats || []);
  await insertRows('audit_log', dump.tables.audit_log || []);
  /* schema_migrations is intentionally not restored: the target database has
     already run the migrations that created the schema. */

  const maxRev = await client.query('SELECT COALESCE(MAX(rev), 0)::bigint AS max FROM records');
  await client.query("SELECT setval('record_rev_seq', $1::bigint, true)", [String(BigInt(maxRev.rows[0].max) + 1n)]);
  await client.query("SELECT setval(pg_get_serial_sequence('audit_log', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM audit_log");

  await client.query('ALTER TABLE records ENABLE ROW LEVEL SECURITY');
  await client.query('ALTER TABLE records FORCE ROW LEVEL SECURITY');
  await client.query('ALTER TABLE files ENABLE ROW LEVEL SECURITY');
  await client.query('ALTER TABLE files FORCE ROW LEVEL SECURITY');

  await client.query('COMMIT');
  console.log('restore complete');
  console.log('Copy the files directory (object_key paths) to the same STORAGE_DIR next.');
} catch (error) {
  await client.query('ROLLBACK').catch(() => undefined);
  console.error('restore failed', error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
