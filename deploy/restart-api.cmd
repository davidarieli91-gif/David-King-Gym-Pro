@echo off
rem Restarts only the API (the embedded PostgreSQL is already running).
cd /d "%~dp0..\server"
start "DKG API" /min cmd /c "npm run start"
