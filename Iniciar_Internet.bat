@echo off
chcp 65001 >nul
title Blockstrike - Iniciar para internet (gratis)
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Necesitas Node.js instalado: https://nodejs.org
  pause
  exit /b 1
)
rem 1) servidor del juego en su propia ventana
start "Blockstrike - Servidor" cmd /k "cd /d %~dp0 && set PORT=52018 && node server\server.js"
timeout /t 2 >nul
rem 2) tunel gratis: si dejaste cloudflared.exe en esta carpeta usa Cloudflare (mas estable); si no, localhost.run
set "TUNEL=%~dp0Tunel_Gratis.ps1"
if exist "%~dp0cloudflared.exe" set "TUNEL=%~dp0Tunel_Cloudflare.ps1"
if exist "%~dp0cloudflared\cloudflared.exe" set "TUNEL=%~dp0Tunel_Cloudflare.ps1"
start "Blockstrike - Tunel" powershell -NoProfile -ExecutionPolicy Bypass -File "%TUNEL%"
timeout /t 12 >nul
rem 3) abre el juego para ti
start "" "http://localhost:52018/"
