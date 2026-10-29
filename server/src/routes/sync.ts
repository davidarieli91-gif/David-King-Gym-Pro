import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate, csrfProtection } from '../auth/middleware';
import { withTenant } from '../db';
import { errors } from '../lib/errors';
import { upsertRecord } from '../lib/records';
import { parse } from '../lib/validate';

const pullSchema = z.object({
  since: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(1000).default(500),
});

const changeSchema = z.object({
  collection: z.string().regex(/^[a-z0-9_]{1,64}$/),
  id: z.string().min(1).max(200),
  data: z.unknown().optional(),
  deleted: z.boolean().optional(),
});

const pushSchema = z.object({
  changes: z.array(changeSchema).min(1).max(500),
});

interface RecordRow {
  collection: string;
  record_id: string;
  data: unknown;
  rev: string;
  deleted_at: Date | null;
}

interface StatsRow {
  client_count: number;
  record_count: number;
  storage_bytes: string;
  last_sync_at: Date | null;
}

export const syncRoutes: FastifyPluginAsync = async (app) => {
  app.get('/bootstrap', { preHandler: [authenticate] }, async (request) => {
    const auth = request.auth!;
    const data = await withTenant(auth.tenant.id, async (client) => {
      const statsResult = await client.query<StatsRow>(
        `SELECT client_count, record_count, storage_bytes, last_sync_at
         FROM trainer_stats WHERE tenant_id = $1`,
        [auth.tenant.id],
      );
      const revResult = await client.query<{ rev: string }>(
        'SELECT COALESCE(MAX(rev), 0)::text AS rev FROM records WHERE tenant_id = $1',
        [auth.tenant.id],
      );

      return {
        stats: statsResult.rows[0] ?? {
          client_count: 0,
          record_count: 0,
          storage_bytes: '0',
          last_sync_at: null,
        },
        serverRev: Number(revResult.rows[0]?.rev ?? 0),
      };
    });

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
      stats: {
        clients: data.stats.client_count,
        records: data.stats.record_count,
        storageBytes: Number(data.stats.storage_bytes),
        lastSyncAt: data.stats.last_sync_at,
      },
      serverRev: data.serverRev,
    };
  });

  app.get('/sync', { preHandler: [authenticate] }, async (request) => {
    const auth = request.auth!;
    const query = parse(pullSchema, request.query);

    return withTenant(auth.tenant.id, async (client) => {
      const result = await client.query<RecordRow>(
        `SELECT collection, record_id, data, rev::text, deleted_at
         FROM records
         WHERE tenant_id = $1 AND rev > $2
         ORDER BY rev ASC
         LIMIT $3`,
        [auth.tenant.id, query.since, query.limit],
      );

      const records = result.rows.map((row) => ({
        collection: row.collection,
        id: row.record_id,
        data: row.data,
        rev: Number(row.rev),
        deleted: Boolean(row.deleted_at),
      }));

      const nextSince = records.length ? records[records.length - 1].rev : query.since;
      return {
        records,
        nextSince,
        hasMore: records.length === query.limit,
      };
    });
  });

  app.post('/sync', { preHandler: [authenticate, csrfProtection] }, async (request) => {
    const auth = request.auth!;
    const body = parse(pushSchema, request.body);

    for (const change of body.changes) {
      const serialized = JSON.stringify(change.data ?? {});
      if (serialized.length > 256 * 1024) {
        throw errors.badRequest(`Record ${change.collection}/${change.id} is larger than 256 KB`);
      }
    }

    const result = await withTenant(auth.tenant.id, async (client) => {
      const revs: Array<{ collection: string; id: string; rev: number }> = [];

      for (const change of body.changes) {
        const rev = await upsertRecord(
          client,
          auth.tenant.id,
          change.collection,
          change.id,
          change.data ?? {},
          Boolean(change.deleted),
        );
        revs.push({
          collection: change.collection,
          id: change.id,
          rev,
        });
      }

      await client.query('SELECT refresh_trainer_stats($1)', [auth.tenant.id]);

      return { revs, serverTime: new Date().toISOString() };
    });

    return result;
  });

  app.get('/tenant/stats', { preHandler: [authenticate] }, async (request) => {
    const auth = request.auth!;
    return withTenant(auth.tenant.id, async (client) => {
      const result = await client.query<StatsRow>(
        `SELECT client_count, record_count, storage_bytes, last_sync_at
         FROM trainer_stats WHERE tenant_id = $1`,
        [auth.tenant.id],
      );
      const row = result.rows[0] ?? {
        client_count: 0,
        record_count: 0,
        storage_bytes: '0',
        last_sync_at: null,
      };
      return {
        clients: row.client_count,
        records: row.record_count,
        storageBytes: Number(row.storage_bytes),
        lastSyncAt: row.last_sync_at,
      };
    });
  });
};
