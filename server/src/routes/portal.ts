import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { config } from '../config';
import { authenticate, csrfProtection } from '../auth/middleware';
import { hashPassword, verifyPassword } from '../auth/passwords';
import { pool, withTenant, withTransaction } from '../db';
import { audit } from '../lib/audit';
import { apiError, errors } from '../lib/errors';
import { upsertRecord } from '../lib/records';
import { hashPortalToken, randomToken } from '../lib/tokens';
import { parse } from '../lib/validate';

const issueSchema = z.object({
  pin: z.string().min(4).max(20).optional(),
  expiresInDays: z.coerce.number().int().min(1).max(3650).optional(),
  label: z.string().trim().max(120).optional(),
});

const listSchema = z.object({
  clientId: z.string().min(1).max(200).optional(),
});

const recordWriteSchema = z.object({
  collection: z.enum(['checkins', 'weight_logs', 'workout_logs', 'nutrition_logs']),
  id: z.string().min(1).max(200).optional(),
  data: z.record(z.string(), z.unknown()),
});

const portalReadCollections = [
  'client_programs',
  'workout_history',
  'nutrition_plans',
  'checkins',
  'weight_logs',
  'workout_logs',
  'nutrition_logs',
] as const;

/* The portal never receives the trainer's private client fields (portal
   password, share key, internal notes, phone, email…). It only gets what the
   trainee needs to see on their own screen. */
const PORTAL_CLIENT_FIELDS = [
  'full_name',
  'goal',
  'weight',
  'target_weight',
  'body_fat_pct',
  'height',
  'age',
  'gender',
  'training_days',
  'portal_blind',
  'photo_url',
  'allergies',
] as const;

function portalClient(client: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of PORTAL_CLIENT_FIELDS) {
    if (field in client) out[field] = client[field];
  }
  return out;
}

interface PortalTokenRow {
  id: string;
  tenant_id: string;
  client_id: string;
  pin_hash: string | null;
  label: string | null;
  expires_at: Date | null;
}

interface ClientRecordRow {
  data: Record<string, unknown>;
}

async function resolvePortalToken(token: string, pin: string | undefined): Promise<{
  token: PortalTokenRow;
  tenantName: string;
  settings: Record<string, unknown>;
  client: Record<string, unknown>;
}> {
  const result = await pool.query<PortalTokenRow>(
    `SELECT id, tenant_id, client_id, pin_hash, label, expires_at
     FROM portal_tokens
     WHERE token_hash = $1
       AND revoked_at IS NULL
       AND (expires_at IS NULL OR expires_at > now())`,
    [hashPortalToken(token)],
  );
  const row = result.rows[0];
  if (!row) throw errors.notFound('Portal link is invalid or expired');

  if (row.pin_hash) {
    if (!pin) throw apiError(401, 'pin_required', 'Portal PIN is required');
    if (!(await verifyPassword(row.pin_hash, pin))) {
      throw errors.forbidden('Invalid portal PIN');
    }
  }

  await pool.query('UPDATE portal_tokens SET last_used_at = now() WHERE id = $1', [row.id]);

  const tenantResult = await pool.query<{ display_name: string; settings: Record<string, unknown> }>(
    `SELECT display_name, settings FROM tenants WHERE id = $1 AND status = 'active'`,
    [row.tenant_id],
  );
  const tenant = tenantResult.rows[0];
  if (!tenant) throw errors.notFound('Portal link is no longer active');

  const client = await withTenant(row.tenant_id, async (db) => {
    const clientResult = await db.query<ClientRecordRow>(
      `SELECT data FROM records
       WHERE tenant_id = $1 AND collection = 'clients' AND record_id = $2 AND deleted_at IS NULL`,
      [row.tenant_id, row.client_id],
    );
    return clientResult.rows[0]?.data;
  });
  if (!client) throw errors.notFound('Client was not found');

  return {
    token: row,
    tenantName: tenant.display_name,
    settings: tenant.settings ?? {},
    client,
  };
}

export const portalRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    '/clients/:clientId/portal-token',
    { preHandler: [authenticate, csrfProtection] },
    async (request, reply) => {
      const auth = request.auth!;
      const params = parse(z.object({ clientId: z.string().min(1).max(200) }), request.params);
      const body = parse(issueSchema, request.body);

      const client = await withTenant(auth.tenant.id, async (db) => {
        const result = await db.query<ClientRecordRow>(
          `SELECT data FROM records
           WHERE tenant_id = $1 AND collection = 'clients' AND record_id = $2 AND deleted_at IS NULL`,
          [auth.tenant.id, params.clientId],
        );
        return result.rows[0]?.data;
      });
      if (!client) throw errors.notFound('Client not found');

      const token = randomToken(32);
      const pinHash = body.pin ? await hashPassword(body.pin) : null;
      const expiresAt = body.expiresInDays
        ? new Date(Date.now() + body.expiresInDays * 86_400_000)
        : null;

      const result = await withTransaction(async (client) => {
        // One active link per client: reissuing invalidates the previous URL.
        await client.query(
          `UPDATE portal_tokens SET revoked_at = now()
           WHERE tenant_id = $1 AND client_id = $2 AND revoked_at IS NULL`,
          [auth.tenant.id, params.clientId],
        );
        return client.query<{ id: string; created_at: Date }>(
          `INSERT INTO portal_tokens (tenant_id, client_id, token_hash, pin_hash, label, expires_at, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id, created_at`,
          [
            auth.tenant.id,
            params.clientId,
            hashPortalToken(token),
            pinHash,
            body.label ?? null,
            expiresAt,
            auth.user.id,
          ],
        );
      });

      await audit({
        tenantId: auth.tenant.id,
        actorUserId: auth.user.id,
        action: 'portal.token_created',
        target: result.rows[0].id,
        meta: { clientId: params.clientId, pin: Boolean(body.pin), expiresAt },
        ip: request.ip,
      });

      return reply.code(201).send({
        id: result.rows[0].id,
        token,
        url: `${config.PUBLIC_BASE_URL}/p/${token}`,
        label: body.label ?? null,
        pinRequired: Boolean(body.pin),
        expiresAt,
        createdAt: result.rows[0].created_at,
      });
    },
  );

  app.get('/portal-tokens', { preHandler: [authenticate] }, async (request) => {
    const auth = request.auth!;
    const query = parse(listSchema, request.query);

    const result = await pool.query<{
      id: string;
      client_id: string;
      label: string | null;
      expires_at: Date | null;
      revoked_at: Date | null;
      last_used_at: Date | null;
      created_at: Date;
    }>(
      `SELECT id, client_id, label, expires_at, revoked_at, last_used_at, created_at
       FROM portal_tokens
       WHERE tenant_id = $1 AND ($2::text IS NULL OR client_id = $2)
       ORDER BY created_at DESC
       LIMIT 200`,
      [auth.tenant.id, query.clientId ?? null],
    );

    return {
      tokens: result.rows.map((row) => ({
        id: row.id,
        clientId: row.client_id,
        label: row.label,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at,
        lastUsedAt: row.last_used_at,
        createdAt: row.created_at,
      })),
    };
  });

  app.delete('/portal-tokens/:id', { preHandler: [authenticate, csrfProtection] }, async (request) => {
    const auth = request.auth!;
    const params = parse(z.object({ id: z.string().uuid() }), request.params);

    const result = await pool.query(
      `UPDATE portal_tokens SET revoked_at = now()
       WHERE id = $1 AND tenant_id = $2 AND revoked_at IS NULL
       RETURNING id`,
      [params.id, auth.tenant.id],
    );
    if (!result.rowCount) throw errors.notFound('Portal token not found');

    await audit({
      tenantId: auth.tenant.id,
      actorUserId: auth.user.id,
      action: 'portal.token_revoked',
      target: params.id,
      ip: request.ip,
    });
    return { ok: true };
  });

  app.get(
    '/portal/:token',
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (request) => {
      const params = parse(z.object({ token: z.string().min(16).max(500) }), request.params);
      const pin = request.headers['x-portal-pin'];
      const resolved = await resolvePortalToken(params.token, typeof pin === 'string' ? pin : undefined);

      return {
        client: portalClient(resolved.client),
        tenant: {
          name: resolved.tenantName,
          brand: String(resolved.settings.brand ?? 'David King Gym'),
          attribution: String(resolved.settings.attribution ?? 'Provided by David King Gym'),
        },
        portal: {
          clientId: resolved.token.client_id,
          label: resolved.token.label,
          pinRequired: Boolean(resolved.token.pin_hash),
          expiresAt: resolved.token.expires_at,
        },
      };
    },
  );

  app.get(
    '/portal/:token/records',
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (request) => {
      const params = parse(z.object({ token: z.string().min(16).max(500) }), request.params);
      const query = parse(
        z.object({ collection: z.enum(portalReadCollections).optional() }),
        request.query,
      );
      const pin = request.headers['x-portal-pin'];
      const resolved = await resolvePortalToken(params.token, typeof pin === 'string' ? pin : undefined);

      const collections = query.collection ? [query.collection] : [...portalReadCollections];
      return withTenant(resolved.token.tenant_id, async (db) => {
        const result = await db.query<{ collection: string; record_id: string; data: unknown; rev: string }>(
          `SELECT collection, record_id, data, rev::text
           FROM records
           WHERE tenant_id = $1
             AND collection = ANY($2::text[])
             AND data->>'client_id' = $3
             AND deleted_at IS NULL
           ORDER BY updated_at DESC
           LIMIT 500`,
          [resolved.token.tenant_id, collections, resolved.token.client_id],
        );

        return {
          records: result.rows.map((row) => ({
            collection: row.collection,
            id: row.record_id,
            data: row.data,
            rev: Number(row.rev),
          })),
        };
      });
    },
  );

  app.post(
    '/portal/:token/records',
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (request) => {
      const params = parse(z.object({ token: z.string().min(16).max(500) }), request.params);
      const body = parse(recordWriteSchema, request.body);
      const pin = request.headers['x-portal-pin'];
      const resolved = await resolvePortalToken(params.token, typeof pin === 'string' ? pin : undefined);

      const data = { ...body.data, client_id: resolved.token.client_id };
      const recordId = body.id ?? randomToken(12);

      const rev = await withTenant(resolved.token.tenant_id, async (db) => {
        const next = await upsertRecord(
          db,
          resolved.token.tenant_id,
          body.collection,
          recordId,
          data,
        );
        await db.query('SELECT refresh_trainer_stats($1)', [resolved.token.tenant_id]);
        return next;
      });

      return { id: recordId, rev };
    },
  );
};
