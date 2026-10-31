@echo off
title Blockstrike - Servidor local
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Necesitas Node.js instalado: https://nodejs.org
  pause
  exit /b 1
)
set PORT=52018
node server\server.js
pause
