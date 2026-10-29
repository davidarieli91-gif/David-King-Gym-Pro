@echo off
rem Starts the temporary Windows host: embedded PostgreSQL, then the DKG API.
rem Portable: works from any copy of this repository.

cd /d "%~dp0..\server"

start "DKG PostgreSQL" /min cmd /c "npm run dev:db"
timeout /t 6 /nobreak >nul
start "DKG API" /min cmd /c "npm run start"
