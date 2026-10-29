import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { config } from '../config';
import { pool, withTransaction } from '../db';
import { authenticate, csrfProtection } from '../auth/middleware';
import {
  clearAuthCookies,
  createSession,
  deleteSession,
  deleteUserSessions,
  setAuthCookies,
} from '../auth/sessions';
import { hashPassword, verifyPassword } from '../auth/passwords';
import { audit } from '../lib/audit';
import { errors } from '../lib/errors';
import { tenantSlug } from '../lib/ids';
import { hashInviteCode, randomToken, sha256 } from '../lib/tokens';
import { parse } from '../lib/validate';
import { sendMail } from '../mail';

const registerSchema = z.object({
  inviteCode: z.string().trim().min(4).max(64),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(10).max(200),
  tenantName: z.string().trim().min(2).max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(10).max(200),
});

const forgotSchema = z.object({
  email: z.string().trim().email().max(254),
});

const resetSchema = z.object({
  token: z.string().min(16).max(500),
  password: z.string().min(10).max(200),
});

const DEFAULT_TENANT_SETTINGS = {
  units: 'metric',
  language: 'ru',
  theme: 'dark',
  brand: 'David King Gym',
  attribution: 'Provided by David King Gym',
};

interface UserRow {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  role: 'director' | 'trainer';
  display_name: string;
  status: string;
}

interface TenantRow {
  id: string;
  slug: string;
  display_name: string;
  status: string;
  settings: Record<string, unknown>;
}

function publicUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
  };
}

function publicTenant(tenant: TenantRow) {
  return {
    id: tenant.id,
    name: tenant.display_name,
    slug: tenant.slug,
    settings: tenant.settings ?? {},
  };
}

function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === '23505');
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/register',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const body = parse(registerSchema, request.body);
      const email = body.email.toLowerCase();
      const codeHash = hashInviteCode(body.inviteCode);
      const passwordHash = await hashPassword(body.password);

      let created: { tenant: TenantRow; user: UserRow } | null = null;

      try {
        created = await withTransaction(async (client) => {
          const inviteResult = await client.query<{
            id: string;
            max_uses: number;
            uses: number;
          }>(
            `SELECT id, max_uses, uses
             FROM invites
             WHERE code_hash = $1
               AND revoked_at IS NULL
               AND (expires_at IS NULL OR expires_at > now())
             FOR UPDATE`,
            [codeHash],
          );

          const invite = inviteResult.rows[0];
          if (!invite) throw errors.notFound('Invite code is invalid or expired');
          if (invite.max_uses > 0 && invite.uses >= invite.max_uses) {
            throw errors.conflict('Invite code has reached its limit');
          }

          const existing = await client.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email]);
          if (existing.rowCount) throw errors.conflict('An account with this email already exists');

          const tenantResult = await client.query<TenantRow>(
            `INSERT INTO tenants (slug, display_name, settings)
             VALUES ($1, $2, $3)
             RETURNING id, slug, display_name, status, settings`,
            [tenantSlug(body.tenantName || body.name), body.tenantName || body.name, JSON.stringify(DEFAULT_TENANT_SETTINGS)],
          );
          const tenant = tenantResult.rows[0];

          const userResult = await client.query<UserRow>(
            `INSERT INTO users (tenant_id, email, password_hash, role, display_name)
             VALUES ($1, $2, $3, 'trainer', $4)
             RETURNING id, tenant_id, email, password_hash, role, display_name, status`,
            [tenant.id, email, passwordHash, body.name],
          );
          const user = userResult.rows[0];

          await client.query('UPDATE tenants SET owner_user_id = $1 WHERE id = $2', [user.id, tenant.id]);
          await client.query('INSERT INTO trainer_stats (tenant_id) VALUES ($1)', [tenant.id]);
          await client.query('UPDATE invites SET uses = uses + 1 WHERE id = $1', [invite.id]);

          return { tenant, user };
        });
      } catch (error) {
        if (isUniqueViolation(error)) throw errors.conflict('An account with this email already exists');
        throw error;
      }

      if (!created) throw errors.internal();

      const session = await createSession(created.user.id, request);
      setAuthCookies(reply, session.token, session.csrfToken, session.expiresAt);

      await audit({
        tenantId: created.tenant.id,
        actorUserId: created.user.id,
        action: 'auth.register',
        target: created.user.id,
        meta: { email },
        ip: request.ip,
      });

      return reply.code(201).send({
        user: publicUser(created.user),
        tenant: publicTenant(created.tenant),
        csrfToken: session.csrfToken,
      });
    },
  );

  app.post(
    '/login',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const body = parse(loginSchema, request.body);
      const email = body.email.toLowerCase();

      const result = await pool.query<UserRow & { tenant_status: string; tenant_name: string; tenant_slug: string; settings: Record<string, unknown> }>(
        `SELECT u.*, t.status AS tenant_status, t.display_name AS tenant_name,
                t.slug AS tenant_slug, t.settings
         FROM users u
         JOIN tenants t ON t.id = u.tenant_id
         WHERE lower(u.email) = lower($1)`,
        [email],
      );

      const row = result.rows[0];
      if (!row || !(await verifyPassword(row.password_hash, body.password))) {
        throw errors.unauthorized('Invalid email or password');
      }
      if (row.status !== 'active') throw errors.forbidden('Account is suspended');
      if (row.tenant_status !== 'active') throw errors.forbidden('Workspace is suspended');

      await pool.query('UPDATE users SET last_login_at = now() WHERE id = $1', [row.id]);

      const session = await createSession(row.id, request);
      setAuthCookies(reply, session.token, session.csrfToken, session.expiresAt);

      await audit({
        tenantId: row.tenant_id,
        actorUserId: row.id,
        action: 'auth.login',
        target: row.id,
        ip: request.ip,
      });

      return reply.send({
        user: publicUser(row),
        tenant: {
          id: row.tenant_id,
          name: row.tenant_name,
          slug: row.tenant_slug,
          settings: row.settings ?? {},
        },
        csrfToken: session.csrfToken,
      });
    },
  );

  app.get('/me', { preHandler: [authenticate] }, async (request) => {
    const auth = request.auth!;
    return {
      user: {
        id: auth.user.id,
        email: auth.user.email,
        displayName: auth.user.displayName,
        role: auth.user.role,
      },
      tenant: {
        id: auth.tenant.id,
        name: auth.tenant.name,
        slug: auth.tenant.slug,
        settings: auth.tenant.settings,
      },
    };
  });

  app.post('/logout', { preHandler: [authenticate, csrfProtection] }, async (request, reply) => {
    await deleteSession(request.auth!.sessionId);
    clearAuthCookies(reply);
    await audit({
      tenantId: request.auth!.tenant.id,
      actorUserId: request.auth!.user.id,
      action: 'auth.logout',
      ip: request.ip,
    });
    return reply.code(204).send();
  });

  app.post('/password', { preHandler: [authenticate, csrfProtection] }, async (request, reply) => {
    const body = parse(passwordChangeSchema, request.body);
    const auth = request.auth!;

    const result = await pool.query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = $1',
      [auth.user.id],
    );
    const row = result.rows[0];
    if (!row || !(await verifyPassword(row.password_hash, body.currentPassword))) {
      throw errors.unauthorized('Current password is incorrect');
    }

    const nextHash = await hashPassword(body.newPassword);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [nextHash, auth.user.id]);
    await deleteUserSessions(auth.user.id, auth.sessionId);

    await audit({
      tenantId: auth.tenant.id,
      actorUserId: auth.user.id,
      action: 'auth.password_changed',
      ip: request.ip,
    });

    return reply.code(204).send();
  });

  app.post(
    '/forgot',
    { config: { rateLimit: { max: 5, timeWindow: '5 minutes' } } },
    async (request, reply) => {
      const body = parse(forgotSchema, request.body);
      const email = body.email.toLowerCase();

      const result = await pool.query<{ id: string; tenant_id: string; email: string }>(
        'SELECT id, tenant_id, email FROM users WHERE lower(email) = lower($1)',
        [email],
      );
      const user = result.rows[0];

      if (user) {
        const token = randomToken(32);
        await pool.query(
          `INSERT INTO password_resets (user_id, token_hash, expires_at)
           VALUES ($1, $2, now() + interval '1 hour')`,
          [user.id, sha256(`reset:${token}`)],
        );

        const link = `${config.PUBLIC_BASE_URL}/reset?token=${encodeURIComponent(token)}`;
        await sendMail({
          to: user.email,
          subject: 'David King Gym — password reset',
          text: `Open this link to reset your password. It expires in 1 hour.\n\n${link}\n\nIf you did not request it, ignore this email.`,
        });

        await audit({
          tenantId: user.tenant_id,
          actorUserId: user.id,
          action: 'auth.password_reset_requested',
          target: user.id,
          ip: request.ip,
        });
      }

      // Always the same answer, so the endpoint cannot enumerate accounts.
      return reply.send({ ok: true });
    },
  );

  app.post(
    '/reset',
    { config: { rateLimit: { max: 10, timeWindow: '10 minutes' } } },
    async (request, reply) => {
      const body = parse(resetSchema, request.body);
      const tokenHash = sha256(`reset:${body.token}`);

      const result = await pool.query<{ id: string; user_id: string; tenant_id: string }>(
        `SELECT pr.id, pr.user_id, u.tenant_id
         FROM password_resets pr
         JOIN users u ON u.id = pr.user_id
         WHERE pr.token_hash = $1 AND pr.used_at IS NULL AND pr.expires_at > now()`,
        [tokenHash],
      );
      const reset = result.rows[0];
      if (!reset) throw errors.badRequest('Reset link is invalid or expired');

      const nextHash = await hashPassword(body.password);
      await withTransaction(async (client) => {
        await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [nextHash, reset.user_id]);
        await client.query('UPDATE password_resets SET used_at = now() WHERE id = $1', [reset.id]);
        await client.query('DELETE FROM sessions WHERE user_id = $1', [reset.user_id]);
      });

      await audit({
        tenantId: reset.tenant_id,
        actorUserId: reset.user_id,
        action: 'auth.password_reset',
        target: reset.user_id,
        ip: request.ip,
      });

      return reply.code(204).send();
    },
  );
};
