-- 001_init.sql — multi-tenant foundation for David King Gym.
-- Every tenant-owned row carries tenant_id. Records and files are protected by
-- PostgreSQL row-level security (FORCE) in addition to API scoping.

CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'trainer' CHECK (role IN ('director', 'trainer')),
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));
CREATE INDEX users_tenant_idx ON users (tenant_id);

ALTER TABLE tenants
  ADD CONSTRAINT tenants_owner_user_fk
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL UNIQUE,
  label text,
  max_uses integer NOT NULL DEFAULT 0 CHECK (max_uses >= 0),
  uses integer NOT NULL DEFAULT 0 CHECK (uses >= 0),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  csrf_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  ip text,
  user_agent text
);

CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);

CREATE SEQUENCE record_rev_seq;

CREATE TABLE records (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  collection text NOT NULL,
  record_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  rev bigint NOT NULL DEFAULT nextval('record_rev_seq'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  PRIMARY KEY (tenant_id, collection, record_id)
);

CREATE INDEX records_tenant_rev_idx ON records (tenant_id, rev);
CREATE INDEX records_tenant_collection_idx
  ON records (tenant_id, collection)
  WHERE deleted_at IS NULL;

ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE records FORCE ROW LEVEL SECURITY;
CREATE POLICY records_tenant_policy ON records
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id text,
  object_key text NOT NULL UNIQUE,
  filename text NOT NULL,
  mime text NOT NULL,
  size bigint NOT NULL CHECK (size >= 0),
  sha256 text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX files_tenant_idx ON files (tenant_id, created_at DESC);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE files FORCE ROW LEVEL SECURITY;
CREATE POLICY files_tenant_policy ON files
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE TABLE portal_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  pin_hash text,
  label text,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX portal_tokens_tenant_client_idx ON portal_tokens (tenant_id, client_id);

CREATE TABLE trainer_stats (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  client_count integer NOT NULL DEFAULT 0,
  record_count integer NOT NULL DEFAULT 0,
  storage_bytes bigint NOT NULL DEFAULT 0,
  last_sync_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  target text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_tenant_idx ON audit_log (tenant_id, created_at DESC);
CREATE INDEX audit_log_created_idx ON audit_log (created_at DESC);

-- Recomputes the aggregate values that the director is allowed to see.
-- It never exposes client rows, only counts.
CREATE OR REPLACE FUNCTION refresh_trainer_stats(p_tenant_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO trainer_stats (tenant_id, client_count, record_count, last_sync_at, updated_at)
  SELECT
    p_tenant_id,
    (SELECT count(*) FROM records
      WHERE tenant_id = p_tenant_id AND collection = 'clients' AND deleted_at IS NULL),
    (SELECT count(*) FROM records
      WHERE tenant_id = p_tenant_id AND deleted_at IS NULL),
    now(),
    now()
  ON CONFLICT (tenant_id) DO UPDATE SET
    client_count = EXCLUDED.client_count,
    record_count = EXCLUDED.record_count,
    last_sync_at = EXCLUDED.last_sync_at,
    updated_at = now();
$$;
