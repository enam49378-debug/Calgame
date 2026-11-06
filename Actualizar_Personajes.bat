@echo off
rem Junta las carpetas de personajes/<id>/ (animaciones, etc.) en los archivos que lee el juego.
rem   Actualizar_Personajes.bat             regenera lo que cambio
rem   Actualizar_Personajes.bat --importar  pasa a las carpetas lo que otra herramienta escribio en js/animations.js
cd /d "%~dp0"
python tools\actualizar_personajes.py %*
pause
