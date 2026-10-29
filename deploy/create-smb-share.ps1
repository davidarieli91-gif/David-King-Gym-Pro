# David King Gym — create the LAN share for F:\DKG
# Right-click -> "Run with PowerShell" as Administrator, or run from an
# elevated PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\create-smb-share.ps1
#
# This only exposes F:\DKG on the local network. It does NOT open SMB to the
# internet. The public trainer app is served separately through Tailscale Funnel.

$ErrorActionPreference = 'Stop'

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host 'This script must run as Administrator.' -ForegroundColor Red
    Write-Host 'Right-click it and choose "Run with PowerShell" as administrator.'
    exit 1
}

$folder = 'F:\DKG'
$shareName = 'DKG'

Write-Host "Creating $folder ..."
New-Item -ItemType Directory -Path $folder -Force | Out-Null

Write-Host 'Granting LAN users modify access to the folder ...'
icacls $folder /grant 'Everyone:(OI)(CI)M' | Out-Null

if (Get-SmbShare -Name $shareName -ErrorAction SilentlyContinue) {
    Write-Host "Updating existing share $shareName ..."
    Set-SmbShare -Name $shareName -Path $folder -Description 'David King Gym data' -Force
} else {
    Write-Host "Creating share $shareName ..."
    New-SmbShare -Name $shareName -Path $folder -ChangeAccess 'Everyone' -Description 'David King Gym data' | Out-Null
}

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
Write-Host 'Press Enter to close this window...' -ForegroundColor Cyan
Read-Host | Out-Null
