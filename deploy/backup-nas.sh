#!/bin/sh
# DKG — daily backup of the NAS deployment.
# Writes a plain-SQL dump of the whole DKG database plus the client files
# (photos/documents) into the HDD pool, keeping the last 14 dumps.
#
# Usage (as root or via sudo):
#   sudo sh /volume2/dkg/App/deploy/backup-nas.sh
#
# Cron entry (sudo crontab -e):
#   0 3 * * * /bin/sh /volume2/dkg/App/deploy/backup-nas.sh >> /var/log/dkg-backup.log 2>&1
set -eu

BACKUP_ROOT="${DKG_BACKUP_ROOT:-/volume1/backups/dkg}"
PG_CONTAINER="${DKG_PG_CONTAINER:-deploy-db-1}"
FILES_SRC="${DKG_FILES_DIR:-/volume2/dkg/data/files}"

mkdir -p "$BACKUP_ROOT/db" "$BACKUP_ROOT/files"
stamp=$(date +%Y-%m-%dT%H-%M-%S)

echo "[$(date)] dkg backup started"

docker exec "$PG_CONTAINER" pg_dump -U dkg -d dkg | gzip > "$BACKUP_ROOT/db/dkg-$stamp.sql.gz"
echo "dump written: $BACKUP_ROOT/db/dkg-$stamp.sql.gz"

if [ -d "$FILES_SRC" ] && [ -n "$(ls -A "$FILES_SRC" 2>/dev/null)" ]; then
  mkdir -p "$BACKUP_ROOT/files/$stamp"
  cp -a "$FILES_SRC"/. "$BACKUP_ROOT/files/$stamp"/
  echo "files copied: $BACKUP_ROOT/files/$stamp"
else
  echo "files volume empty — skipped"
fi

find "$BACKUP_ROOT/db" -name 'dkg-*.sql.gz' -mtime +14 -delete
find "$BACKUP_ROOT/files" -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +

echo "[$(date)] dkg backup finished"
