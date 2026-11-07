# Música

`menu.mp3` suena en el menú y `pelea1.mp3`, `pelea2.mp3` y `pelea3.mp3` en las peleas (en orden aleatorio). Son pistas aportadas por el autor del juego (convertidas de WAV a MP3). La tecla **M** activa o desactiva la música.

### Pistas Instrumentales de HYPNOTIC DATA (SIN VOZ - Choques y Pegada Idéntica):
- `hypnotic_choques_identico.mp3`: Versión 1 (máxima pegada, choques de bombo phonk a 46Hz, acorde stab supersaw distorsionado y sub-bajo 808 rugiente, 100% instrumental sin voz).
- `hypnotic_choques_intermedio.mp3`: Versión 2 (intermedia: los mismos choques pesados y agresivos combinados con arpegios estéreo de 16-bit arcade).
- `hypnotic_choques_arcade.mp3`: Versión 3 (recreación retro hardcore con choques contundentes y sintetizadores arcade).
- Generadas con `python tools/recreate_hypnotic_choques.py`.

### Pistas con Voces (Odetari):
- `hypnotic_data_original.mp3`: Con la voz original de Odetari en loop continuo de 28.27s.
- `hypnotic_data_intermedio.mp3`: Híbrido voces + sintetizadores.
- `hypnotic_data_arcade.mp3`: Versión arcade suave.

*Tip:* Podés renombrar cualquiera de estas pistas a `pelea4.mp3`, reemplazar `menu.mp3` o asignarla como tema de ulti en `personajes/<id>/Skills/Ulti/Sound/ulti.mp3`.

`ulti/<personaje>.mp3` es el tema de la ulti de cada personaje: suena al activar tu ulti y la música de pelea baja mientras dura. Se generan con `python tools/make_ult_music.py` (o `python tools/make_ult_music.py javi` para uno solo); la receta de cada uno (tempo, escala, instrumentos y ritmos) está en `SPEC` dentro de ese archivo. Si reemplazás un archivo por tu propia canción con el mismo nombre, el juego usa la tuya.
