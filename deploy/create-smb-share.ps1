# David King Gym — create the LAN share for F:\DKG\Shared
# Right-click -> "Run with PowerShell" as Administrator, or run from an
# elevated PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\create-smb-share.ps1
#
# This exposes only F:\DKG\Shared on the local network. It does NOT open SMB
# to the internet. The public trainer app is served separately via Tailscale.

$ErrorActionPreference = 'Stop'
$log = Join-Path $PSScriptRoot 'smb-share.log'

trap {
    Write-Host ''
    Write-Host ('ERROR: ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host ($_.ScriptStackTrace)
    try { Stop-Transcript | Out-Null } catch {}
    Write-Host 'Log: ' + $log
    Read-Host 'Press Enter to close'
    exit 1
}

Start-Transcript -Path $log -Force | Out-Null

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host 'This script must run as Administrator.' -ForegroundColor Red
    Write-Host 'Right-click it and choose "Run with PowerShell" as administrator.'
    Stop-Transcript | Out-Null
    Read-Host 'Press Enter to close'
    exit 1
}

# Share ONLY a dedicated folder. F:\DKG also contains the server .env (secrets),
# the live PostgreSQL data and backups, so it must never be exposed as a share.
$folder = 'F:\DKG\Shared'
$shareName = 'DKG'
$everyone = (New-Object System.Security.Principal.SecurityIdentifier('S-1-1-0')).Translate([System.Security.Principal.NTAccount]).Value

Write-Host "Creating $folder ..."
New-Item -ItemType Directory -Path $folder -Force | Out-Null

Write-Host 'Granting LAN users modify access to the folder ...'
# Use the numeric SID: the English name "Everyone" fails on Russian Windows.
icacls $folder /grant '*S-1-1-0:(OI)(CI)M' | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "icacls failed with exit code $LASTEXITCODE"
}

if (Get-SmbShare -Name $shareName -ErrorAction SilentlyContinue) {
    Write-Host "Updating existing share $shareName ..."
    Set-SmbShare -Name $shareName -Path $folder -Description 'David King Gym data' -Force
} else {
    Write-Host "Creating share $shareName ..."
    New-SmbShare -Name $shareName -Path $folder -Description 'David King Gym data' | Out-Null
}
# The localized Everyone name is "Все" on Russian Windows. The SID translation
# makes the script work on any Windows language.
Grant-SmbShareAccess -Name $shareName -AccountName $everyone -AccessRight Change -Force | Out-Null

Write-Host ''
Write-Host 'Share is ready.' -ForegroundColor Green
Get-SmbShare -Name $shareName | Select-Object Name, Path, Description | Format-List

Write-Host 'LAN paths:'
Write-Host ("  \\{0}\{1}" -f $env:COMPUTERNAME, $shareName)
Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254*' -and $_.PrefixOrigin -ne 'WellKnown' } |
    ForEach-Object { Write-Host ("  \\{0}\{1}" -f $_.IPAddress, $shareName) }

Write-Host ''
Write-Host 'If another PC cannot connect:' -ForegroundColor Yellow
Write-Host '  1. Set the Ethernet network to Private:'
Write-Host '     Set-NetConnectionProfile -InterfaceAlias "Ethernet" -NetworkCategory Private'
Write-Host '  2. Allow File and Printer Sharing:'
Write-Host '     Enable-NetFirewallRule -DisplayGroup "File and Printer Sharing"'
Write-Host '  3. Use the Windows account of this PC when prompted.'
Write-Host ''
Write-Host 'Do not forward SMB ports on the router. This share is for the local network only.'
Write-Host ''
Stop-Transcript | Out-Null
Write-Host 'Press Enter to close this window...' -ForegroundColor Cyan
Read-Host | Out-Null
