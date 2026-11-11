@echo off
setlocal
cd /d "%~dp0"
set "HOST=192.168.1.15"
set "PORT=3100"
echo Apri http://%HOST%:%PORT% su un dispositivo collegato al Wi-Fi di casa.
echo Premi CTRL+C per fermare il server.
node server.mjs
pause
