@echo off
rem Restarts the API and the embedded PostgreSQL in the background.
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0server-control.ps1" restart
