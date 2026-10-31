@echo off
chcp 65001 >nul
title Blockstrike - Iniciar todo
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Necesitas Node.js instalado: https://nodejs.org
  pause
  exit /b 1
)
rem Inicia el servidor del juego en su propia ventana
start "Blockstrike - Servidor" cmd /k "cd /d %~dp0 && node server\server.js"
rem Si descargaste playit.exe (de https://playit.gg) y lo dejaste en esta carpeta o en la subcarpeta playit, tambien lo inicia
set "PLAYIT="
if exist "%~dp0playit.exe" set "PLAYIT=%~dp0playit.exe"
if exist "%~dp0playit\playit.exe" set "PLAYIT=%~dp0playit\playit.exe"
if defined PLAYIT (
  start "playit.gg" "%PLAYIT%"
  echo playit iniciado.
) else (
  echo No se encontro playit.exe: el juego funciona en tu red local.
  echo Para jugar con amigos de otros paises mira LEEME_SERVIDOR.txt ^(seccion playit.gg^).
)
echo.
echo Abre el juego en: http://localhost:8080/
timeout /t 6 >nul
start "" "http://localhost:8080/"
