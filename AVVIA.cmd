@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 24 o successivo deve essere installato.
  pause
  exit /b 1
)
echo Apri http://127.0.0.1:3100 nel browser.
echo Premi CTRL+C per fermare il server.
node server.mjs
pause
