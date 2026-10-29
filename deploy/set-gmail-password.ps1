# David King Gym — configure the Gmail App Password.
# Run by double-clicking "Настроить Gmail для DKG.bat" on the Desktop.
# No administrator rights are needed.

$ErrorActionPreference = 'Stop'
$server = Join-Path $PSScriptRoot '..\server'
$envFile = Join-Path $server '.env'

Write-Host ''
Write-Host 'David King Gym — Gmail App Password' -ForegroundColor Cyan
Write-Host '1. Open https://myaccount.google.com/apppasswords'
Write-Host '2. Create an app password named "DKG Server"'
Write-Host '3. Copy the 16-character password and paste it below'
Write-Host ''

$email = Read-Host 'Gmail address [david.arieli91@gmail.com]'
if ([string]::IsNullOrWhiteSpace($email)) { $email = 'david.arieli91@gmail.com' }

$secure = Read-Host 'Google App Password' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}
$plain = ($plain -replace '\s', '')
if ($plain.Length -lt 10) {
    Write-Host 'The App Password looks too short. Nothing changed.' -ForegroundColor Red
    Read-Host 'Press Enter to close'
    exit 1
}

$content = [System.IO.File]::ReadAllText($envFile)
$content = [regex]::Replace($content, '(?m)^SMTP_USER=.*$', "SMTP_USER=$email")
$content = [regex]::Replace($content, '(?m)^SMTP_PASS=.*$', "SMTP_PASS=$plain")
$content = [regex]::Replace($content, '(?m)^SMTP_FROM=.*$', "SMTP_FROM=David King Gym <$email>")
[System.IO.File]::WriteAllText($envFile, $content, [System.Text.UTF8Encoding]::new($false))

Write-Host 'SMTP settings saved. Restarting the API...' -ForegroundColor Green
$apis = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
    Where-Object { $_.CommandLine -match 'dist[\\/]index\.js' }
foreach ($api in $apis) {
    Stop-Process -Id $api.ProcessId -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1
Start-Process -FilePath (Join-Path $PSScriptRoot 'restart-api.cmd') -WindowStyle Hidden
Start-Sleep -Seconds 3
try {
    Invoke-RestMethod -Uri 'http://127.0.0.1:8080/health' -TimeoutSec 6 | Out-Null
    Write-Host 'API is up.' -ForegroundColor Green
} catch {
    Write-Host 'API did not answer. Double-click "Запустить сервер DKG.bat" on the Desktop.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Done. Password-reset emails will go to' $email -ForegroundColor Green
Write-Host 'Test: https://desktop-kqgq0s0.tailf7ae26.ts.net/fitness-crm.html → Forgot password'
Write-Host ''
Read-Host 'Press Enter to close'
