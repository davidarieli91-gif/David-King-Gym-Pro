import type { PoolClient } from 'pg';

/**
 * Records are addressed by (collection, record_id), while IndexedDB stores also
 * expect the id inside the value. Always keep both in sync so a pull cannot
 * auto-generate a fresh UUID and duplicate the row.
 */
export function normalizeRecordData(collection: string, recordId: string, data: unknown): unknown {
  if (collection === 'settings') return data;
  if (data && typeof data === 'object' && !Array.isArray(data) && !('id' in (data as Record<string, unknown>))) {
    return { ...(data as Record<string, unknown>), id: recordId };
  }
  return data;
}

export async function upsertRecord(
  client: PoolClient,
  tenantId: string,
  collection: string,
  recordId: string,
  data: unknown,
  deleted = false,
): Promise<number> {
  const payload = normalizeRecordData(collection, recordId, data);
  const result = await client.query<{ rev: string }>(
    `INSERT INTO records (tenant_id, collection, record_id, data, rev, updated_at, deleted_at)
     VALUES ($1, $2, $3, $4::jsonb, nextval('record_rev_seq'), now(), $5)
     ON CONFLICT (tenant_id, collection, record_id)
     DO UPDATE SET
       data = EXCLUDED.data,
       rev = nextval('record_rev_seq'),
       updated_at = now(),
       deleted_at = EXCLUDED.deleted_at
     RETURNING rev::text`,
    [
      tenantId,
      collection,
      recordId,
      JSON.stringify(deleted ? {} : payload ?? {}),
      deleted ? new Date() : null,
    ],
  );

  return Number(result.rows[0].rev);
}
