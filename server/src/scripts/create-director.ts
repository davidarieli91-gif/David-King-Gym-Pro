import { hashPassword } from '../auth/passwords';
import { config } from '../config';
import { pool, withTransaction } from '../db';
import { tenantSlug } from '../lib/ids';

const DEFAULT_TENANT_SETTINGS = {
  units: 'metric',
  language: 'ru',
  theme: 'dark',
  brand: 'David King Gym',
  attribution: 'Provided by David King Gym',
};

async function main(): Promise<void> {
  const email = process.env.DIRECTOR_EMAIL?.trim().toLowerCase();
  const password = process.env.DIRECTOR_PASSWORD;
  const name = process.env.DIRECTOR_NAME?.trim() || 'David';
  const tenantName = process.env.TENANT_NAME?.trim() || 'David King Gym';

  if (!email || !password) {
    throw new Error(
      'Set DIRECTOR_EMAIL and DIRECTOR_PASSWORD in server/.env (or pass them as environment variables).',
    );
  }
  if (password.length < 10) {
    throw new Error('DIRECTOR_PASSWORD must be at least 10 characters.');
  }

  const existing = await pool.query("SELECT id FROM users WHERE role = 'director' LIMIT 1");
  if (existing.rowCount) {
    console.log('A director account already exists. Nothing created.');
    return;
  }

  const passwordHash = await hashPassword(password);
  const created = await withTransaction(async (client) => {
    const tenantResult = await client.query<{ id: string; slug: string }>(
      `INSERT INTO tenants (slug, display_name, settings)
       VALUES ($1, $2, $3)
       RETURNING id, slug`,
      [tenantSlug(tenantName), tenantName, JSON.stringify(DEFAULT_TENANT_SETTINGS)],
    );
    const tenant = tenantResult.rows[0];

    const userResult = await client.query<{ id: string }>(
      `INSERT INTO users (tenant_id, email, password_hash, role, display_name)
       VALUES ($1, $2, $3, 'director', $4)
       RETURNING id`,
      [tenant.id, email, passwordHash, name],
    );
    const user = userResult.rows[0];

    await client.query('UPDATE tenants SET owner_user_id = $1 WHERE id = $2', [user.id, tenant.id]);
    await client.query('INSERT INTO trainer_stats (tenant_id) VALUES ($1)', [tenant.id]);

    return { tenantId: tenant.id, userId: user.id, slug: tenant.slug };
  });

  console.log('Director account created:');
  console.log(`  email:      ${email}`);
  console.log(`  tenant id:  ${created.tenantId}`);
  console.log(`  user id:    ${created.userId}`);
  console.log(`  public url: ${config.PUBLIC_BASE_URL}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
