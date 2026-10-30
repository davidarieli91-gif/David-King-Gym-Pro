' Starts the DKG server without any visible console windows.
' Called by the Startup shortcut and by the DKG Server Watchdog task.
Option Explicit

Dim shell, script, command
Set shell = CreateObject("WScript.Shell")
script = "F:\DKG\App\deploy\server-control.ps1"
command = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & script & """ start"
shell.Run command, 0, False
