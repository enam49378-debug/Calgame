# Arquitectura del Juego
- **Cliente:** HTML, CSS y JS puro con **THREE.js** para el 3D (`index.html`). Sin compiladores.
- **Gráficos modulares (`js/graficos/`):** `motor_escena.js`, `materiales_peleador.js`, `escenario_ulti.js`, `efectos_combate.js` y `calidad_post.js` (documentados en `docs/GRAFICOS.md`).
- **Partes separadas de `game.js`:** `js/ui/` (ventanitas, minimapa), `js/editores/` (mapa, audio, animaciones, expresiones), `js/modos/` (vóley) y `js/graficos/armas.js`. Cada una es una fábrica (`CF_UI`, `CF_EDITORES`, `CF_MODOS`, `CF_GRAFICOS`) que `game.js` crea en el lugar donde estaba el código. Para seguir separando, usar `tools/refactor/` (ver su `LEEME.md`) y luego `npm run revisar`.
- **Servidor y Lógica:** Node.js puro sin dependencias externas en `server/`, `js/arbitro.js` (árbitro, salas, monstruos, Kraken) y `js/ambiente.js` (clima de la sala, compartido con el juego). Al subir el servidor a Oracle se copian los dos.
- **Herramientas:** Scripts en Python dentro de `tools/` (`tools/parches_antiguos/`, `tools/audio/`, `tools/discord/`, `tools/launcher/` para utilidades no activas).
- **Documentación:** En `docs/` (`docs/ORDEN_DEL_PROYECTO.md`, `docs/GRAFICOS.md`, etc.).
- **Pruebas:** En JS con `node tests/...`.

## Ubicación de Carpetas de Assets
- **Modelos (.bbmodel):** `modelos/` (también `assets/` y `blockbench/`)
- **Skins/Texturas (.png):** `personajes/<id>/skin.png` (por personaje), `caras/`, `assets/`
- **Audios (.mp3/.wav):** `musica/` (música), `sonidos/` (efectos), `personajes/<id>/**/Sound/` (voces y ultis)

## Modo Privado del Owner (`CF_BETA`, estilo vista privada)
- **Regla para TODA actualización futura** (gráficos, personajes, habilidades, mapas, modos o UI): cualquier novedad no lanzada al público debe ocultarse detrás de `CF_BETA.on` / `CF_BETA.subscribe(on => ...)` (en JS) o de la clase CSS `.cf-beta-only` (`body.cf-beta`).
- **Quién ve las novedades**: automáticamente el **Owner** en la web publicada (al entrar con su sesión verificada `SOC.owner` o clave `DEV.on`, sin necesidad de abrir un servidor local manual) y quien ejecute el repo descargado de Git en local (`localhost` / `127.0.0.1` / `file:`). Para el resto de jugadores en la web pública permanece desactivado (`CF_BETA.on === false`).

- **Estado actual:** `BETA_LANZADA = true` en `js/game.js` (21/11/2026): todo lo que estaba en la vista privada ya es público. La regla de arriba sigue valiendo para lo nuevo: si quieres volver a ocultar novedades, pon `BETA_LANZADA = false`.

## Reglas estrictas para ahorrar tokens
- NUNCA leas ni imprimas el interior de archivos `.bbmodel`, `.png` o `.mp3`.
- Si el usuario deja un archivo nuevo suelto en la raíz o en otra carpeta, muévelo con comandos de terminal (`move` / `mv`) a su carpeta correspondiente y conéctalo al código usando solo su nombre/ruta.
- Si necesitas saber los huesos o animaciones de un `.bbmodel`, usa Python o terminal para extraer únicamente las keys `name` ignorando las texturas base64.
- Haz ediciones quirúrgicas en el código en vez de reescribir archivos enteros.
