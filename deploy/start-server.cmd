@echo off
rem Starts the temporary Windows host: embedded PostgreSQL, then the DKG API.
rem The scheduled task "DKG Server" runs this at logon.

cd /d "G:\OpenCode\David King Gym pro\repo\server"

start "DKG PostgreSQL" /min cmd /c "npm run dev:db"
timeout /t 6 /nobreak >nul
start "DKG API" /min cmd /c "npm run start"
