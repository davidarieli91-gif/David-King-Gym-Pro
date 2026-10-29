# David King Gym — daily local backup.
# Run from Task Scheduler or manually:
#   powershell -ExecutionPolicy Bypass -File .\deploy\backup.ps1
#
# Writes:
#   F:\DKG\backups\db\dkg-YYYY-MM-DDTHH-MM-SS.json   (all SQL tables)
#   F:\DKG\backups\files\YYYY-MM-DD\                 (photos/documents)
#
# Keep at least one copy on a different physical disk. The NAS deployment
# should additionally use pg_dump on the Postgres container and copy the
# MinIO/files volume to an external USB disk.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$server = Join-Path $root 'server'
$backupRoot = 'F:\DKG\backups'

Write-Host 'DKG backup started'

Push-Location $server
try {
    node scripts/backup.mjs
} finally {
    Pop-Location
}

$filesSource = Join-Path $server 'data\files'
if (Test-Path $filesSource) {
    $filesTarget = Join-Path $backupRoot ('files\' + (Get-Date -Format 'yyyy-MM-dd'))
    New-Item -ItemType Directory -Path $filesTarget -Force | Out-Null
    Write-Host "Mirroring files to $filesTarget"
    robocopy $filesSource $filesTarget /MIR /R:1 /W:1 | Out-Null
}

$dbDir = Join-Path $backupRoot 'db'
if (Test-Path $dbDir) {
    Get-ChildItem $dbDir -Filter 'dkg-*.json' |
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-14) } |
        Remove-Item -Force
}

Write-Host 'DKG backup finished' -ForegroundColor Green
