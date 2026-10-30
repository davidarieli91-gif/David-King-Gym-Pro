param(
  [string]$Url = 'https://desktop-kqgq0s0.tailf7ae26.ts.net/fitness-crm.html'
)

$ErrorActionPreference = 'Stop'
$control = Join-Path $PSScriptRoot 'server-control.ps1'

Write-Host 'Starting David King Gym server...'
& $control start

$ready = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/health' -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) { $ready = $true; break }
  } catch {}
  Start-Sleep -Seconds 2
}

if ($ready) {
  Write-Host 'Server is ready. Opening the app...'
} else {
  Write-Host 'Server did not answer in time. Opening the app anyway; refresh the page in a minute.'
}

Start-Process $Url
Start-Sleep -Seconds 2
