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

### Keeping the temporary Windows host online

`start-server.cmd` now starts PostgreSQL and the API through
`start-server-hidden.vbs`, so there are no console windows to close by
accident. Control the host with:

```powershell
powershell -ExecutionPolicy Bypass -File .\server-control.ps1 status
powershell -ExecutionPolicy Bypass -File .\server-control.ps1 start
powershell -ExecutionPolicy Bypass -File .\server-control.ps1 restart
powershell -ExecutionPolicy Bypass -File .\server-control.ps1 stop
```

The `DKG Server Watchdog` scheduled task runs the hidden starter every two
minutes and restarts a crashed API. Logs are written to `deploy/logs/`.

The desktop starters `start-clients.cmd` and `start-director.cmd` start the
host if needed, wait for `/health`, and open the trainer app or the director
console.

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

`create-smb-share.ps1` exposes only the dedicated `F:\DKG\Shared` folder on the
local network. It never shares the server `.env`, the live PostgreSQL data or
the backups. Run it once from an elevated PowerShell (one UAC confirmation is
required):

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

## UGREEN NAS (UGOS) — bind-mount the NVMe volume

The DXP2800 has a 16 TB HDD (`/volume1`) and a 1 TB NVMe (`/volume2`).
Postgres and the client files must sit on the NVMe volume; image layers stay
on `/volume1/@docker` (the Docker app's own root), which is fine.

`deploy/.env` on the NAS carries:

```sh
DKG_PG_DIR=/volume2/dkg/data/pg
DKG_FILES_DIR=/volume2/dkg/data/files
```

The compose file turns those into bind mounts; without them it falls back to
the legacy named volumes, so existing installs are not broken by this change.

Full runbook:

1. UGOS ▸ Control Panel ▸ Terminal ▸ `SSH` ▸ Enable (port 22, `Never` for
   auto-shutdown).
2. UGOS ▸ App Center ▸ search `Docker` ▸ Install.
3. The NVMe is already a pool mounted at `/volume2` (Storage Manager ▸
   Storage Pool); create the tree:
   `sudo mkdir -p /volume2/dkg/{App,data/pg,data/files}` and
   `/volume1/backups/dkg` for the daily dumps.
4. Build the frontend on a machine with the repo, then copy `dist/`,
   `server/src`, `server/migrations`, `server/public`, `server/package*.json`,
   `server/tsconfig.json`, `deploy/` to `/volume2/dkg/App`.
5. `sudo cp deploy/.env.example deploy/.env` and fill it in (values below),
   then `sudo docker compose up -d --build`.

> **Redeploy note (static app is baked into the image).** The API image
> copies `dist/` at build time (`COPY dist ./public-app`), so uploading a new
> `dist/` to the NAS is NOT enough — the running container keeps serving the
> old bundle. After syncing `dist/` to `/volume2/dkg/App/dist`, run
> `docker compose --env-file .env build api && docker compose --env-file .env up -d`
> and re-check `curl -s http://127.0.0.1:8080/health` plus a `grep` for a build
> marker (e.g. the SW `CACHE_NAME`) in the served `/fitness-crm.html`.
> Note: the NAS cannot reach its own Tailscale Funnel URL — verify public
> endpoints from a client machine, not from the NAS itself.
6. Restore the database dump (JSON snapshot from `node scripts/restore.mjs`
   with `RESTORE_CONFIRM=yes`), restart `api`, check `curl -s
   http://127.0.0.1:8080/health`.
7. Install Tailscale CLI (`curl -fsSL https://tailscale.com/install.sh | sh`),
   `sudo tailscale up` (browse to the login link), then
   `sudo tailscale funnel --bg 8080`.
8. Point `PUBLIC_BASE_URL` in `deploy/.env` at the NAS Funnel address and
   restart `api`. Old portal/invite links carry the previous host; send the
   new ones (the app generates them from `PUBLIC_BASE_URL`).
9. Add a cron entry for `deploy/backup-nas.sh` (daily, 03:00) — it writes a
   `pg_dump` and mirrors the files volume into `/volume1/backups/dkg`.

