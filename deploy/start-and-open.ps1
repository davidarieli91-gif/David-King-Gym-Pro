param(
  [string]$Url = 'https://dxp2800server.tailf7ae26.ts.net/fitness-crm.html'
)

$ErrorActionPreference = 'Stop'
# The system now lives on the UGREEN NAS (dxp2800server) and is published
# publicly via Tailscale Funnel. Nothing is started locally anymore.
# If the NAS is unreachable, the page simply won't load — ask the trainer to
# bring the NAS back online (Storage Manager / App Center / docker).
Start-Process $Url
Start-Sleep -Seconds 2
