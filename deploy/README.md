# DKG server deployment

## Local development on Windows

The server uses an embedded PostgreSQL binary for development, so Docker is
not required on the Windows machine.

```powershell
cd server
npm.cmd install
npm.cmd run dev:db      # terminal 1, keeps Postgres on 127.0.0.1:55432
npm.cmd run migrate     # terminal 2, once
# create the director (put values in server/.env first)
npm.cmd run create-director
npm.cmd run dev         # terminal 2, API on http://localhost:8080
```

Test:

```powershell
cd server
npm.cmd test
```

## NAS / production

Requirements: Docker Engine + Docker Compose plugin.

Build the frontend once on the machine that prepares the deployment (the
image ships `dist/`):

```sh
cd ..
npm ci
npm run build
```

Then deploy:

```sh
cd deploy
cp .env.example .env
# edit .env: database password, session secret, invite pepper, public URL,
# Gmail app password
docker compose up -d --build
curl http://127.0.0.1:8080/health
```

The API serves the trainer app at `/fitness-crm.html`, the director console at
`/admin`, the invite registration page at `/join`, and personal trainee links
at `/p/<token>`.

The API binds to `127.0.0.1:8080` only. Publish it through Tailscale Funnel
(or a reverse proxy) instead of opening a port on the router.

Tailscale Funnel example on the NAS:

```sh
tailscale up
tailscale funnel --bg 8080
tailscale funnel status
```

Set `PUBLIC_BASE_URL` to the resulting `https://<machine>.<tailnet>.ts.net`
address. Portal links and invite links are generated from it.

### LAN share on the temporary Windows host

`create-smb-share.ps1` exposes only `F:\DKG` on the local network. Run it once
from an elevated PowerShell (one UAC confirmation is required):

```powershell
powershell -ExecutionPolicy Bypass -File .\create-smb-share.ps1
```

Then map `\\<this-pc>\DKG` or `\\10.100.102.2\DKG` from another computer. Do
not forward SMB ports on the router.

### Backups

On Windows, `backup.ps1` writes:

- `F:\DKG\backups\db\dkg-*.json` — every SQL table;
- `F:\DKG\backups\files\<date>\` — photos/documents.

Run it manually:

```powershell
powershell -ExecutionPolicy Bypass -File .\backup.ps1
```

A Windows task named `DKG Backup` runs it daily at 03:00. A second physical
disk is still required for disaster recovery (the same disk is not a backup).

Restore into a fresh database (migrations are applied automatically by the API
image or by `npm run migrate`):

```powershell
cd server
$env:DATABASE_URL = 'postgres://user:pass@host:5432/dkg'
$env:RESTORE_CONFIRM = 'yes'
node scripts/restore.mjs 'F:\DKG\backups\db\dkg-2026-10-29T15-02-47.json'
```

Then copy the matching `server/data/files` directory to the target
`STORAGE_DIR`. The backup contains password hashes, so existing logins keep
working; sessions are not restored, so users sign in again.

On the NAS:

- `pg_dump` the `db` service daily;
- copy the `dkg_files` volume (photos/documents) to a separate USB disk;
- keep at least one copy outside the NAS.

The compose file uses named volumes. On UGOS, inspect them with:

```sh
docker volume ls
docker volume inspect deploy_dkg_pg
```
