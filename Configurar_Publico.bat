@echo off
chcp 65001 >nul
title Blockstrike - Direccion publica
cd /d "%~dp0"
echo.
echo  Pega aqui la direccion que te dio playit.gg (ejemplo: abc-123.gl.at.ply.gg:45678)
echo  y presiona Enter. Deja vacio y Enter para borrarla.
echo.
set "DIR="
set /p "DIR=Direccion: "
if "%DIR%"=="" (
  > publico.txt echo # Direccion publica de tu servidor para amigos de otros paises. Escribe aqui la de playit.gg ^(sin el #^).
  echo.
  echo  Direccion borrada.
) else (
  > publico.txt echo %DIR%
  echo.
  echo  Guardado. El link de invitacion del juego ya usara: %DIR%
)
echo.
pause
