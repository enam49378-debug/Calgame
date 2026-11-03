# Modo desarrollador (solo para el dueño)

**Cómo se activa**
- En tu PC: doble clic en `Iniciar_Editor.bat` (abre el juego en `http://127.0.0.1:8767`). En localhost el modo viene activo.
- En la web publicada: `Ctrl+Shift+F9` (o abrir con `#dueno` al final de la dirección) y poner la clave de `CLAVE_DUENO.txt` (ese archivo no se sube a GitHub).
- Solo en modo desarrollador aparecen en el menú: Sala de cinemáticas, Editor de expresiones, Editor de animaciones, **Editor de mapa**, **Editor de audio** y Estadísticas. `F4` muestra un panel con FPS y datos de la partida.

**Editor de mapa** (mover, borrar, duplicar, deshacer/rehacer): guarda en `config/mapa.json`.
**Editor de audio** (sonidos generales, música, ambiente y voces con su lógica): guarda en `config/audio.json` y sube los audios nuevos a `sonidos/` y `musica/`.

Para que los cambios valgan para todos los jugadores hay que publicar (`git add config sonidos musica && git commit && git push`). Si abrís el editor sin el servidor (`tools/dev-server.py`) no se pueden subir audios y los archivos de configuración se descargan para que los pongas a mano en `config/`.

Esto es una puerta en tu navegador, no seguridad de servidor: un jugador que modifique su copia solo cambia su propio juego; lo que ven los demás depende de lo que vos publiques.
