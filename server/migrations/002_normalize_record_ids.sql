-- 002_normalize_record_ids.sql
-- c213: server records are addressed by (collection, record_id), but IndexedDB
-- stores also expect the id inside the value. A pull without data.id made
-- db.put() generate a fresh UUID and duplicate the row on every device.
-- Repair existing records and bump their revision so clients re-pull them.

UPDATE records
SET
  data = data || jsonb_build_object('id', record_id),
  rev = nextval('record_rev_seq'),
  updated_at = now()
WHERE collection <> 'settings'
  AND jsonb_typeof(data) = 'object'
  AND NOT (data ? 'id');
