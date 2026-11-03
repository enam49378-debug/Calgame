@echo off
rem Abre el servidor del modo desarrollador y el juego en tu navegador.
cd /d "%~dp0"
start "" http://127.0.0.1:8767/
python tools\dev-server.py
pause
