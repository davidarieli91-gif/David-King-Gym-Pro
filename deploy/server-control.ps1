param(
  [ValidateSet('start', 'stop', 'restart', 'status')]
  [string]$Action = 'start'
)

$ErrorActionPreference = 'Stop'

$AppRoot = 'F:\DKG\App'
$ServerDir = Join-Path $AppRoot 'server'
$LogDir = Join-Path $AppRoot 'deploy\logs'
$ControlLog = Join-Path $LogDir 'server-control.log'
$ApiOutLog = Join-Path $LogDir 'api.out.log'
$ApiErrLog = Join-Path $LogDir 'api.err.log'
$DbOutLog = Join-Path $LogDir 'db.out.log'
$DbErrLog = Join-Path $LogDir 'db.err.log'

$NodeExe = 'C:\Program Files\nodejs\node.exe'
$PgCtl = Join-Path $ServerDir 'node_modules\@embedded-postgres\windows-x64\native\bin\pg_ctl.exe'
$PgData = Join-Path $ServerDir 'data\pg'

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-ControlLog([string]$Message) {
  $line = '[{0}] {1}' -f (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'), $Message
  Add-Content -Path $ControlLog -Value $line -Encoding UTF8
}

function Test-Port([int]$Port) {
  try {
    $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
    return [bool]($listeners | Select-Object -First 1)
  } catch {
    return $false
  }
}

function Wait-Port([int]$Port, [int]$Seconds) {
  for ($i = 0; $i -lt $Seconds; $i++) {
    if (Test-Port $Port) { return $true }
    Start-Sleep -Seconds 1
  }
  return $false
}

function Test-Health() {
  try {
    $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8080/health' -UseBasicParsing -TimeoutSec 5
    return ($response.StatusCode -eq 200)
  } catch {
    return $false
  }
}

function Stop-Api() {
  $apiProcesses = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -match 'dist[\\/]index\.js' }
  foreach ($process in $apiProcesses) {
    Write-ControlLog ('stopping api pid ' + $process.ProcessId)
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }
}

function Stop-Database() {
  # Ask PostgreSQL to shut down cleanly first. Killing the tsx launcher first
  # can terminate the postmaster abruptly and leave crash recovery on restart.
  if ((Test-Path $PgCtl) -and (Test-Port 55432)) {
    try {
      Write-ControlLog 'stopping postgres with pg_ctl'
      & $PgCtl stop -D $PgData -m fast -w 2>&1 | Out-Null
    } catch {
      Write-ControlLog ('pg_ctl stop failed: ' + $_.Exception.Message)
    }
  }

  $dbProcesses = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -match 'dev-db' }
  foreach ($process in $dbProcesses) {
    Write-ControlLog ('stopping db launcher pid ' + $process.ProcessId)
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }

  Start-Sleep -Seconds 2
  $postgresProcesses = Get-CimInstance Win32_Process -Filter "Name='postgres.exe'" |
    Where-Object { $_.CommandLine -match 'data[\\/]pg' }
  foreach ($process in $postgresProcesses) {
    Write-ControlLog ('stopping postgres pid ' + $process.ProcessId)
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
  }
}

function Start-Database() {
  if (Test-Port 55432) {
    Write-ControlLog 'postgres already listening on 55432'
    return $true
  }

  Write-ControlLog 'starting postgres in the background'
  Start-Process -FilePath 'cmd.exe' `
    -ArgumentList '/c', 'npm run dev:db' `
    -WorkingDirectory $ServerDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $DbOutLog `
    -RedirectStandardError $DbErrLog | Out-Null

  if (Wait-Port 55432 90) {
    Write-ControlLog 'postgres is listening on 55432'
    return $true
  }

  Write-ControlLog 'postgres did not open port 55432 in time'
  return $false
}

function Start-Api() {
  if (Test-Port 8080) {
    Write-ControlLog 'api already listening on 8080'
    return $true
  }

  Write-ControlLog 'starting api in the background'
  Start-Process -FilePath $NodeExe `
    -ArgumentList 'dist\index.js' `
    -WorkingDirectory $ServerDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $ApiOutLog `
    -RedirectStandardError $ApiErrLog | Out-Null

  if (Wait-Port 8080 90) {
    Write-ControlLog 'api is listening on 8080'
    return $true
  }

  Write-ControlLog 'api did not open port 8080 in time'
  return $false
}

function Show-Status() {
  $db = Test-Port 55432
  $api = Test-Port 8080
  $health = Test-Health
  $text = 'postgres={0} api={1} health={2}' -f $db, $api, $health
  Write-ControlLog $text
  Write-Output $text
  if ($health) { exit 0 } else { exit 1 }
}

$mutex = New-Object System.Threading.Mutex($false, 'Local\DKGServerControl')
if (-not $mutex.WaitOne(0)) {
  Write-ControlLog 'another server-control instance is already running'
  exit 0
}

try {
  switch ($Action) {
    'start' {
      # Watchdog runs often. If everything is already healthy, stay silent.
      if ((Test-Port 55432) -and (Test-Port 8080) -and (Test-Health)) { exit 0 }
      Write-ControlLog 'start requested'
      if (-not (Start-Database)) { exit 1 }

      # Port open but health failing means a hung API. Restart it.
      if ((Test-Port 8080) -and (-not (Test-Health))) {
        Write-ControlLog 'api is not healthy; restarting it'
        Stop-Api
        Start-Sleep -Seconds 2
      }
      if (-not (Start-Api)) { exit 1 }
      if (-not (Test-Health)) {
        Write-ControlLog 'api started but health check failed'
        exit 1
      }
      Write-ControlLog 'server is ready'
      exit 0
    }
    'stop' {
      Write-ControlLog 'stop requested'
      Stop-Api
      Stop-Database
      Write-ControlLog 'server stopped'
      exit 0
    }
    'restart' {
      Write-ControlLog 'restart requested'
      Stop-Api
      Stop-Database
      Start-Sleep -Seconds 2
      if (-not (Start-Database)) { exit 1 }
      if (-not (Start-Api)) { exit 1 }
      if (-not (Test-Health)) {
        Write-ControlLog 'api restarted but health check failed'
        exit 1
      }
      Write-ControlLog 'server restarted and ready'
      exit 0
    }
    'status' {
      Show-Status
    }
  }
} catch {
  Write-ControlLog ('unhandled error: ' + $_.Exception.Message)
  exit 1
} finally {
  try { $mutex.ReleaseMutex() | Out-Null } catch {}
  $mutex.Dispose()
}
