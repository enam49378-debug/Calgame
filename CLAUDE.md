# Arquitectura del Juego
- **Cliente:** HTML, CSS y JS puro con **THREE.js** para el 3D (`index.html`). Sin compiladores.
- **Servidor y Lógica:** Node.js puro sin dependencias externas en `server/` y `js/arbitro.js` (árbitro, salas, monstruos, Kraken).
- **Herramientas:** Scripts en Python dentro de `tools/` para generar personajes, modelos y audios.
- **Pruebas:** En JS con `node tests/...`.

## Ubicación de Carpetas de Assets
- **Modelos (.bbmodel):** `modelos/` (también `assets/` y `blockbench/`)
- **Skins/Texturas (.png):** `personajes/<id>/skin.png` (por personaje), `caras/`, `assets/`
- **Audios (.mp3/.wav):** `musica/` (música), `sonidos/` (efectos), `personajes/<id>/**/Sound/` (voces y ultis)

## Reglas estrictas para ahorrar tokens
- NUNCA leas ni imprimas el interior de archivos `.bbmodel`, `.png` o `.mp3`.
- Si el usuario deja un archivo nuevo suelto en la raíz o en otra carpeta, muévelo con comandos de terminal (`move` / `mv`) a su carpeta correspondiente y conéctalo al código usando solo su nombre/ruta.
- Si necesitas saber los huesos o animaciones de un `.bbmodel`, usa Python o terminal para extraer únicamente las keys `name` ignorando las texturas base64.
- Haz ediciones quirúrgicas en el código en vez de reescribir archivos enteros.
