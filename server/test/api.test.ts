import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from 'pg';
import type { FastifyInstance } from 'fastify';

const TEST_DB = 'dkg_test';
const ADMIN_URL = 'postgres://postgres:postgres@127.0.0.1:55432/postgres';
const TEST_URL = `postgres://postgres:postgres@127.0.0.1:55432/${TEST_DB}`;

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_URL;
process.env.SESSION_SECRET = 'test-session-secret-0123456789';
process.env.INVITE_PEPPER = 'test-invite-pepper-0123456789';
process.env.COOKIE_SECURE = 'false';
process.env.PUBLIC_BASE_URL = 'http://localhost:8080';

let app: FastifyInstance;
let pool: {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number | null }>;
  end: () => Promise<void>;
};
let hashPassword: (value: string) => Promise<string>;
let inviteCode: () => string;
let hashInviteCode: (value: string) => string;

type CookieJar = Record<string, string>;

function cookieHeader(jar: CookieJar): string {
  return Object.entries(jar).map(([key, value]) => `${key}=${value}`).join('; ');
}

function jarFrom(response: { cookies: Array<{ name: string; value: string }> }): CookieJar {
  return Object.fromEntries(response.cookies.map((cookie) => [cookie.name, cookie.value]));
}

async function inject(
  method: string,
  url: string,
  options: { payload?: unknown; cookies?: CookieJar; headers?: Record<string, string> } = {},
) {
  const headers: Record<string, string> = { ...(options.headers ?? {}) };
  if (options.cookies) headers.cookie = cookieHeader(options.cookies);
  return app.inject({
    method: method as 'GET' | 'POST' | 'DELETE',
    url,
    payload: options.payload,
    headers,
  });
}

async function login(email: string, password: string) {
  const response = await inject('POST', '/api/auth/login', { payload: { email, password } });
  assert.equal(response.statusCode, 200, response.body);
  const cookies = jarFrom(response);
  return { cookies, csrf: cookies.dkg_csrf, body: response.json() };
}

async function seedDirector() {
  const password = 'Director12345!';
  const passwordHash = await hashPassword(password);
  const tenant = await pool.query(
    `INSERT INTO tenants (slug, display_name, settings)
     VALUES ('test-director', 'Director Gym', '{"brand":"David King Gym"}')
     RETURNING id`,
  );
  const tenantId = tenant.rows[0].id as string;
  const user = await pool.query(
    `INSERT INTO users (tenant_id, email, password_hash, role, display_name)
     VALUES ($1, 'director@test.local', $2, 'director', 'Director')
     RETURNING id`,
    [tenantId, passwordHash],
  );
  const userId = user.rows[0].id as string;
  await pool.query('UPDATE tenants SET owner_user_id = $1 WHERE id = $2', [userId, tenantId]);
  await pool.query('INSERT INTO trainer_stats (tenant_id) VALUES ($1)', [tenantId]);
  return { tenantId, userId, email: 'director@test.local', password };
}

async function seedInvite(createdBy: string, maxUses = 0) {
  const code = inviteCode();
  await pool.query(
    `INSERT INTO invites (code_hash, label, max_uses, created_by)
     VALUES ($1, 'test', $2, $3)`,
    [hashInviteCode(code), maxUses, createdBy],
  );
  return code;
}

async function registerTrainer(code: string, name: string, email: string, password = 'Trainer12345!') {
  const response = await inject('POST', '/api/auth/register', {
    payload: { inviteCode: code, name, email, password, tenantName: `${name} Gym` },
  });
  assert.equal(response.statusCode, 201, response.body);
  const cookies = jarFrom(response);
  return { cookies, csrf: cookies.dkg_csrf, body: response.json() };
}

async function pushRecord(cookies: CookieJar, csrf: string, collection: string, id: string, data: unknown) {
  const response = await inject('POST', '/api/sync', {
    cookies,
    headers: { 'x-csrf-token': csrf },
    payload: { changes: [{ collection, id, data }] },
  });
  assert.equal(response.statusCode, 200, response.body);
  return response.json();
}

before(async () => {
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${TEST_DB}`);
  await admin.end();

  const migrate = await import('../src/migrate');
  await migrate.runMigrations();

  const db = await import('../src/db');
  pool = db.pool;

  const passwords = await import('../src/auth/passwords');
  hashPassword = passwords.hashPassword;

  const tokens = await import('../src/lib/tokens');
  inviteCode = tokens.inviteCode;
  hashInviteCode = tokens.hashInviteCode;

  const server = await import('../src/app');
  app = await server.buildApp({ logger: false });
  await app.ready();
});

after(async () => {
  await app.close();
  await pool.end();
});

beforeEach(async () => {
  await pool.query(`
    TRUNCATE TABLE
      audit_log,
      portal_tokens,
      files,
      records,
      trainer_stats,
      sessions,
      password_resets,
      invites,
      users,
      tenants
    RESTART IDENTITY CASCADE
  `);
  await pool.query('ALTER SEQUENCE record_rev_seq RESTART WITH 1');
});

test('health endpoint reports a live database', async () => {
  const response = await inject('GET', '/health');
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().ok, true);
});

test('director can create an invite and see only aggregate trainer rows', async () => {
  const director = await seedDirector();
  const loginResult = await login(director.email, director.password);

  const created = await inject('POST', '/api/admin/invites', {
    cookies: loginResult.cookies,
    headers: { 'x-csrf-token': loginResult.csrf },
    payload: { label: 'all trainers', maxUses: 0 },
  });
  assert.equal(created.statusCode, 201, created.body);
  const invite = created.json();
  assert.match(invite.code, /^DKG-/);
  assert.ok(invite.joinUrl.includes(invite.code));

  const trainer = await registerTrainer(invite.code, 'Alice Trainer', 'alice@test.local');
  await pushRecord(trainer.cookies, trainer.csrf, 'clients', 'alice_client', {
    full_name: 'Alice Client',
    goal: 'fat_loss',
  });

  const trainers = await inject('GET', '/api/admin/trainers', { cookies: loginResult.cookies });
  assert.equal(trainers.statusCode, 200, trainers.body);
  const body = trainers.json();
  const row = body.trainers.find((item: { tenantName: string }) => item.tenantName === 'Alice Trainer Gym');
  assert.ok(row);
  assert.equal(row.clientCount, 1);
  assert.equal(row.recordCount, 1);
  assert.equal(row.isSelf, false);

  // The director payload must never contain tenant record data.
  assert.equal(body.trainers.some((item: { tenantName: string }) => item.tenantName.includes('Alice Client')), false);
  assert.equal(trainers.body.includes('Alice Client'), false);

  const overview = await inject('GET', '/api/admin/overview', { cookies: loginResult.cookies });
  assert.equal(overview.statusCode, 200);
  assert.equal(overview.json().clients, 1);
  assert.equal(overview.json().tenants, 2);
});

test('trainers are isolated from each other and from the director', async () => {
  const director = await seedDirector();
  const directorLogin = await login(director.email, director.password);
  const invite = await seedInvite(director.userId);

  const first = await registerTrainer(invite, 'First Trainer', 'first@test.local');
  await pushRecord(first.cookies, first.csrf, 'clients', 'first_client', {
    full_name: 'First Client',
    goal: 'hypertrophy',
  });

  const second = await registerTrainer(invite, 'Second Trainer', 'second@test.local');

  const secondPull = await inject('GET', '/api/sync?since=0', { cookies: second.cookies });
  assert.equal(secondPull.statusCode, 200, secondPull.body);
  assert.deepEqual(secondPull.json().records, []);

  const secondAdmin = await inject('GET', '/api/admin/trainers', { cookies: second.cookies });
  assert.equal(secondAdmin.statusCode, 403);
  assert.equal(secondAdmin.json().error.code, 'forbidden');

  const stealPortal = await inject('POST', '/api/clients/first_client/portal-token', {
    cookies: second.cookies,
    headers: { 'x-csrf-token': second.csrf },
    payload: {},
  });
  assert.equal(stealPortal.statusCode, 404);

  const directorPull = await inject('GET', '/api/sync?since=0', { cookies: directorLogin.cookies });
  assert.equal(directorPull.statusCode, 200);
  assert.deepEqual(directorPull.json().records, []);
});

test('portal tokens are tenant-scoped and can require a PIN', async () => {
  const director = await seedDirector();
  const invite = await seedInvite(director.userId);
  const trainer = await registerTrainer(invite, 'Portal Trainer', 'portal@test.local');
  await pushRecord(trainer.cookies, trainer.csrf, 'clients', 'portal_client', {
    full_name: 'Portal Client',
    goal: 'strength',
  });

  const issued = await inject('POST', '/api/clients/portal_client/portal-token', {
    cookies: trainer.cookies,
    headers: { 'x-csrf-token': trainer.csrf },
    payload: { label: 'Phone link', pin: '2468' },
  });
  assert.equal(issued.statusCode, 201, issued.body);
  const token = issued.json();

  const withoutPin = await inject('GET', `/api/portal/${token.token}`);
  assert.equal(withoutPin.statusCode, 401);
  assert.equal(withoutPin.json().error.code, 'pin_required');

  const wrongPin = await inject('GET', `/api/portal/${token.token}`, { headers: { 'x-portal-pin': '0000' } });
  assert.equal(wrongPin.statusCode, 403);

  const withPin = await inject('GET', `/api/portal/${token.token}`, { headers: { 'x-portal-pin': '2468' } });
  assert.equal(withPin.statusCode, 200, withPin.body);
  assert.equal(withPin.json().client.full_name, 'Portal Client');
  assert.equal(withPin.json().tenant.brand, 'David King Gym');

  const revoked = await inject('DELETE', `/api/portal-tokens/${token.id}`, {
    cookies: trainer.cookies,
    headers: { 'x-csrf-token': trainer.csrf },
  });
  assert.equal(revoked.statusCode, 200, revoked.body);

  const afterRevoke = await inject('GET', `/api/portal/${token.token}`, { headers: { 'x-portal-pin': '2468' } });
  assert.equal(afterRevoke.statusCode, 404);
});

test('suspending a tenant locks its trainer out until resumed', async () => {
  const director = await seedDirector();
  const loginResult = await login(director.email, director.password);
  const invite = await seedInvite(director.userId);
  const trainer = await registerTrainer(invite, 'Suspend Trainer', 'suspend@test.local');

  const trainers = await inject('GET', '/api/admin/trainers', { cookies: loginResult.cookies });
  const tenantId = trainers.json().trainers.find((item: { tenantName: string }) => item.tenantName === 'Suspend Trainer Gym').tenantId;

  const suspended = await inject('POST', `/api/admin/tenants/${tenantId}/suspend`, {
    cookies: loginResult.cookies,
    headers: { 'x-csrf-token': loginResult.csrf },
  });
  assert.equal(suspended.statusCode, 200, suspended.body);

  const meAfterSuspend = await inject('GET', '/api/auth/me', { cookies: trainer.cookies });
  assert.equal(meAfterSuspend.statusCode, 401);

  const resumed = await inject('POST', `/api/admin/tenants/${tenantId}/resume`, {
    cookies: loginResult.cookies,
    headers: { 'x-csrf-token': loginResult.csrf },
  });
  assert.equal(resumed.statusCode, 200, resumed.body);

  const newLogin = await login('suspend@test.local', 'Trainer12345!');
  assert.equal(newLogin.body.user.role, 'trainer');
});
