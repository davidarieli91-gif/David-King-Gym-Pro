import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate, csrfProtection, requireDirector } from '../auth/middleware';
import { config } from '../config';
import { pool } from '../db';
import { audit } from '../lib/audit';
import { errors } from '../lib/errors';
import { hashInviteCode, inviteCode } from '../lib/tokens';
import { parse } from '../lib/validate';

const trainersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const inviteCreateSchema = z.object({
  label: z.string().trim().max(120).optional(),
  maxUses: z.coerce.number().int().min(0).max(100000).default(0),
  expiresInDays: z.coerce.number().int().min(1).max(365).optional(),
});

const auditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

interface TrainerRow {
  tenant_id: string;
  tenant_name: string;
  tenant_status: string;
  created_at: Date;
  email: string | null;
  owner_name: string | null;
  role: 'director' | 'trainer' | null;
  last_login_at: Date | null;
  client_count: number;
  record_count: number;
  storage_bytes: string;
  last_sync_at: Date | null;
}

export const adminRoutes: FastifyPluginAsync = async (app) => {
  const guard = [authenticate, requireDirector, csrfProtection];

  app.get('/overview', { preHandler: guard }, async (request) => {
    const result = await pool.query<{
      tenants: string;
      active_tenants: string;
      clients: string;
      storage_bytes: string;
    }>(
      `SELECT
         (SELECT count(*) FROM tenants)::text AS tenants,
         (SELECT count(*) FROM tenants WHERE status = 'active')::text AS active_tenants,
         (SELECT COALESCE(sum(client_count), 0) FROM trainer_stats)::text AS clients,
         (SELECT COALESCE(sum(storage_bytes), 0) FROM trainer_stats)::text AS storage_bytes`,
    );
    const row = result.rows[0];
    return {
      tenants: Number(row?.tenants ?? 0),
      activeTenants: Number(row?.active_tenants ?? 0),
      clients: Number(row?.clients ?? 0),
      storageBytes: Number(row?.storage_bytes ?? 0),
      selfTenantId: request.auth!.tenant.id,
    };
  });

  app.get('/trainers', { preHandler: guard }, async (request) => {
    const query = parse(trainersQuerySchema, request.query);
    const result = await pool.query<TrainerRow>(
      `SELECT
         t.id AS tenant_id,
         t.display_name AS tenant_name,
         t.status AS tenant_status,
         t.created_at,
         u.email,
         u.display_name AS owner_name,
         u.role,
         u.last_login_at,
         COALESCE(s.client_count, 0) AS client_count,
         COALESCE(s.record_count, 0) AS record_count,
         COALESCE(s.storage_bytes, 0)::text AS storage_bytes,
         s.last_sync_at
       FROM tenants t
       LEFT JOIN users u ON u.id = t.owner_user_id
       LEFT JOIN trainer_stats s ON s.tenant_id = t.id
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
      [query.limit, query.offset],
    );

    return {
      trainers: result.rows.map((row) => ({
        tenantId: row.tenant_id,
        tenantName: row.tenant_name,
        status: row.tenant_status,
        createdAt: row.created_at,
        email: row.email,
        ownerName: row.owner_name,
        role: row.role,
        lastLoginAt: row.last_login_at,
        clientCount: row.client_count,
        recordCount: row.record_count,
        storageBytes: Number(row.storage_bytes),
        lastSyncAt: row.last_sync_at,
        isSelf: row.tenant_id === request.auth!.tenant.id,
      })),
      limit: query.limit,
      offset: query.offset,
    };
  });

  app.post(
    '/invites',
    { preHandler: guard, config: { rateLimit: { max: 30, timeWindow: '1 hour' } } },
    async (request, reply) => {
      const body = parse(inviteCreateSchema, request.body);
      const code = inviteCode();
      const expiresAt = body.expiresInDays
        ? new Date(Date.now() + body.expiresInDays * 86_400_000)
        : null;

      const result = await pool.query<{ id: string; created_at: Date }>(
        `INSERT INTO invites (code_hash, label, max_uses, expires_at, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, created_at`,
        [hashInviteCode(code), body.label ?? null, body.maxUses, expiresAt, request.auth!.user.id],
      );

      const invite = result.rows[0];
      await audit({
        tenantId: request.auth!.tenant.id,
        actorUserId: request.auth!.user.id,
        action: 'admin.invite_created',
        target: invite.id,
        meta: { label: body.label ?? null, maxUses: body.maxUses, expiresInDays: body.expiresInDays ?? null },
        ip: request.ip,
      });

      return reply.code(201).send({
        id: invite.id,
        code,
        label: body.label ?? null,
        maxUses: body.maxUses,
        expiresAt,
        createdAt: invite.created_at,
        joinUrl: `${config.PUBLIC_BASE_URL}/join?code=${encodeURIComponent(code)}`,
      });
    },
  );

  app.get('/invites', { preHandler: guard }, async () => {
    const result = await pool.query<{
      id: string;
      label: string | null;
      max_uses: number;
      uses: number;
      expires_at: Date | null;
      revoked_at: Date | null;
      created_at: Date;
    }>(
      `SELECT id, label, max_uses, uses, expires_at, revoked_at, created_at
       FROM invites
       ORDER BY created_at DESC
       LIMIT 200`,
    );

    return {
      invites: result.rows.map((row) => ({
        id: row.id,
        label: row.label,
        maxUses: row.max_uses,
        uses: row.uses,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at,
        createdAt: row.created_at,
      })),
    };
  });

  app.delete('/invites/:id', { preHandler: guard }, async (request) => {
    const params = parse(z.object({ id: z.string().uuid() }), request.params);
    const result = await pool.query('UPDATE invites SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL RETURNING id', [params.id]);
    if (!result.rowCount) throw errors.notFound('Invite not found');

    await audit({
      tenantId: request.auth!.tenant.id,
      actorUserId: request.auth!.user.id,
      action: 'admin.invite_revoked',
      target: params.id,
      ip: request.ip,
    });
    return { ok: true };
  });

  app.post('/tenants/:id/suspend', { preHandler: guard }, async (request) => {
    const params = parse(z.object({ id: z.string().uuid() }), request.params);
    if (params.id === request.auth!.tenant.id) {
      throw errors.badRequest('You cannot suspend your own workspace');
    }
    const result = await pool.query(
      `UPDATE tenants SET status = 'suspended', updated_at = now()
       WHERE id = $1 AND status <> 'suspended' RETURNING id`,
      [params.id],
    );
    if (!result.rowCount) throw errors.notFound('Workspace not found or already suspended');

    await audit({
      tenantId: request.auth!.tenant.id,
      actorUserId: request.auth!.user.id,
      action: 'admin.tenant_suspended',
      target: params.id,
      ip: request.ip,
    });
    return { ok: true };
  });

  app.post('/tenants/:id/resume', { preHandler: guard }, async (request) => {
    const params = parse(z.object({ id: z.string().uuid() }), request.params);
    const result = await pool.query(
      `UPDATE tenants SET status = 'active', updated_at = now()
       WHERE id = $1 AND status <> 'active' RETURNING id`,
      [params.id],
    );
    if (!result.rowCount) throw errors.notFound('Workspace not found or already active');

    await audit({
      tenantId: request.auth!.tenant.id,
      actorUserId: request.auth!.user.id,
      action: 'admin.tenant_resumed',
      target: params.id,
      ip: request.ip,
    });
    return { ok: true };
  });

  app.get('/audit', { preHandler: guard }, async (request) => {
    const query = parse(auditQuerySchema, request.query);
    const result = await pool.query<{
      id: string;
      tenant_id: string | null;
      actor_user_id: string | null;
      action: string;
      target: string | null;
      meta: unknown;
      ip: string | null;
      created_at: Date;
    }>(
      `SELECT id::text, tenant_id, actor_user_id, action, target, meta, ip, created_at
       FROM audit_log
       ORDER BY created_at DESC
       LIMIT $1`,
      [query.limit],
    );

    return {
      entries: result.rows.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        actorUserId: row.actor_user_id,
        action: row.action,
        target: row.target,
        meta: row.meta,
        ip: row.ip,
        createdAt: row.created_at,
      })),
    };
  });
};
