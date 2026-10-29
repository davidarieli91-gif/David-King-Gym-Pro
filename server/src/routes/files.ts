import { FastifyPluginAsync } from 'fastify';
import { extname } from 'node:path';
import { z } from 'zod';
import { authenticate, csrfProtection } from '../auth/middleware';
import { withTenant } from '../db';
import { errors } from '../lib/errors';
import { newId } from '../lib/ids';
import { deleteObject, readStream, saveStream } from '../storage/local';
import { parse } from '../lib/validate';

const uploadQuerySchema = z.object({
  clientId: z.string().min(1).max(200).optional(),
});

interface FileRow {
  id: string;
  filename: string;
  mime: string;
  size: string;
  sha256: string | null;
  client_id: string | null;
  created_at: Date;
  object_key: string;
}

export const fileRoutes: FastifyPluginAsync = async (app) => {
  app.post('/', { preHandler: [authenticate, csrfProtection] }, async (request, reply) => {
    const auth = request.auth!;
    const query = parse(uploadQuerySchema, request.query);
    const upload = await request.file();

    if (!upload) throw errors.badRequest('File is required');
    if (query.clientId) {
      const exists = await withTenant(auth.tenant.id, async (db) => {
        const result = await db.query(
          `SELECT 1 FROM records
           WHERE tenant_id = $1 AND collection = 'clients' AND record_id = $2 AND deleted_at IS NULL`,
          [auth.tenant.id, query.clientId],
        );
        return Boolean(result.rowCount);
      });
      if (!exists) throw errors.notFound('Client not found');
    }

    const extension = extname(upload.filename || '').toLowerCase().replace(/[^.a-z0-9]/g, '').slice(0, 12);
    const objectKey = `${auth.tenant.id}/${newId()}${extension}`;
    const saved = await saveStream(objectKey, upload.file);

    const result = await withTenant(auth.tenant.id, async (db) => {
      const inserted = await db.query<FileRow>(
        `INSERT INTO files (tenant_id, client_id, object_key, filename, mime, size, sha256, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, filename, mime, size::text, sha256, client_id, created_at, object_key`,
        [
          auth.tenant.id,
          query.clientId ?? null,
          objectKey,
          upload.filename || 'file',
          upload.mimetype || 'application/octet-stream',
          saved.size,
          saved.sha256,
          auth.user.id,
        ],
      );
      await db.query(
        `UPDATE trainer_stats
         SET storage_bytes = (SELECT COALESCE(sum(size), 0) FROM files WHERE tenant_id = $1),
             updated_at = now()
         WHERE tenant_id = $1`,
        [auth.tenant.id],
      );
      return inserted.rows[0];
    });

    return reply.code(201).send({
      id: result.id,
      filename: result.filename,
      mime: result.mime,
      size: Number(result.size),
      sha256: result.sha256,
      clientId: result.client_id,
      createdAt: result.created_at,
    });
  });

  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const auth = request.auth!;
    const params = parse(z.object({ id: z.string().uuid() }), request.params);

    const file = await withTenant(auth.tenant.id, async (db) => {
      const result = await db.query<FileRow>(
        `SELECT id, filename, mime, size::text, sha256, client_id, created_at, object_key
         FROM files WHERE id = $1 AND tenant_id = $2`,
        [params.id, auth.tenant.id],
      );
      return result.rows[0];
    });
    if (!file) throw errors.notFound('File not found');

    reply.header('Content-Type', file.mime);
    reply.header('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`);
    reply.header('Cache-Control', 'private, max-age=3600');
    return reply.send(readStream(file.object_key));
  });

  app.delete('/:id', { preHandler: [authenticate, csrfProtection] }, async (request, reply) => {
    const auth = request.auth!;
    const params = parse(z.object({ id: z.string().uuid() }), request.params);

    const deleted = await withTenant(auth.tenant.id, async (db) => {
      const result = await db.query<{ object_key: string }>(
        `DELETE FROM files WHERE id = $1 AND tenant_id = $2 RETURNING object_key`,
        [params.id, auth.tenant.id],
      );
      if (!result.rowCount) return null;
      await db.query(
        `UPDATE trainer_stats
         SET storage_bytes = (SELECT COALESCE(sum(size), 0) FROM files WHERE tenant_id = $1),
             updated_at = now()
         WHERE tenant_id = $1`,
        [auth.tenant.id],
      );
      return result.rows[0];
    });

    if (!deleted) throw errors.notFound('File not found');
    await deleteObject(deleted.object_key);
    return reply.code(204).send();
  });
};
