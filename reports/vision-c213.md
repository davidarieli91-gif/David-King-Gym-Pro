# c213 - server-first multi-tenant edition

## Goal

One branded trainer app where any number of trainers can register with an
invite code and work in fully isolated workspaces. The server owns the data;
the browser is only a cache. The director sees trainer names and client counts,
never their clients.

## What shipped

### Server (new)

- Fastify + TypeScript API with PostgreSQL.
- Tenant model: `tenants`, `users`, `sessions`, `invites`, `records`, `files`,
  `portal_tokens`, `trainer_stats`, `audit_log`.
- Tenant-scoped records with `tenant_id`, monotonic revisions and tombstones.
- Row-level security on `records` and `files` (`FORCE ROW LEVEL SECURITY`).
- Invite registration: one reusable code, automatic tenant creation, no
  per-trainer Firebase project.
- Director console at `/admin`: trainer list, client counts, storage, invite
  codes, suspend/resume. No client records are exposed.
- Trainer app at `/fitness-crm.html`.
- Client portal at `/p/<token>` with an optional (default-on) PIN.
- Personal portal tokens are hashed at rest, one active link per client.
- Portal responses strip `portal_pass`, `portal_sk`, internal notes and other
  private client fields.
- Files stored server-side with tenant checks and size limits.
- Email/password auth (Argon2id), server sessions, CSRF, rate limits.
- Password reset infrastructure (Gmail SMTP once an App Password is set).
- Audit log for logins, invites, portal links and admin actions.

### Trainer app

- Server gate: checks `/api/auth/me` before boot; email/password login.
- Tenant-scoped IndexedDB (`fitness_crm_db_<tenantId>`).
- Durable outbox (`sync_outbox`) so local edits survive reloads.
- Server-first sync: push/pull through `/api/sync`; remote changes applied with
  the server ID injected into the value (no duplicate rows).
- Reference food/exercise catalogues and device seed flags are not uploaded.
- Firebase is hard-disabled in server mode: no Firebase init, no dirty hooks,
  no cloud panel, and `window.cloudSync` is replaced with no-ops.
- Settings shows server status, pending queue, last revision, manual sync,
  local upload, password change and the director console link.
- Portal modal now issues a server token and shows QR/PIN/WhatsApp/link.
- Backup import clears the migration flag so imported local data is uploaded.

### Deployment

- Local development uses an embedded PostgreSQL binary (UTF8), no Docker.
- Docker image and Compose file for the future UGREEN DXP2800.
- Tailscale Funnel exposes the API over free HTTPS without opening router ports.
- Daily local backup to `F:\DKG\backups` (JSON + files), Windows task
  `DKG Backup` at 03:00.
- SMB share helper: `deploy/create-smb-share.ps1` (requires one UAC approval).

## Security model

- The API takes `tenant_id` from the session, never from the request body.
- Director endpoints only read `tenants`, `users`, `trainer_stats`, `invites`
  and `audit_log`; they never query `records`.
- Portal tokens are 32 random bytes, stored as SHA-256 hashes, bound to tenant
  and client, revocable, and expire if configured.
- The portal never returns the trainer's private client fields.
- The server owner (David) can technically access the database; this matches
  the agreed model (application/API isolation, not zero-knowledge).

## Verification

- Server integration tests: 5/5 (health, director aggregates, cross-tenant
  isolation, portal PIN/revocation, suspend/resume).
- Frontend suite: 71/71 test files.
- Browser end-to-end:
  - director login over HTTPS;
  - invite creation;
  - new trainer registration and empty workspace;
  - trainer login on a tenant-specific DB;
  - one client pulled with the correct Hebrew name;
  - portal token, PIN gate, program, nutrition and check-in;
  - trainer denied `/api/admin/*` and `/admin` UI.
- Public URL: `https://desktop-kqgq0s0.tailf7ae26.ts.net`.
- Live build `c213`, service worker `dk-gym-v240`.

## Pending

- Run `deploy/create-smb-share.ps1` as administrator on the Windows host.
- Set the real director Gmail and Gmail App Password for password resets.
- Migrate the director's existing local data: export backup in the old app,
  import it in the server app, then use "Загрузить локальные данные".
- Deploy the same Docker Compose stack to the UGREEN DXP2800 when it arrives.
- Move backups to a separate physical USB disk on the NAS.
- Full portal parity (voice coach, recovery map, full nutrition diary).
