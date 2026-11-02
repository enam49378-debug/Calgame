# Música

`menu.mp3` suena en el menú y `pelea1.mp3`, `pelea2.mp3` y `pelea3.mp3` en las peleas (en orden aleatorio). Son pistas aportadas por el autor del juego (convertidas de WAV a MP3). La tecla **M** activa o desactiva la música.


`ulti/<personaje>.mp3` es el tema de la ulti de cada personaje: suena al activar tu ulti y la música de pelea baja mientras dura. Se generan con `python tools/make_ult_music.py` (o `python tools/make_ult_music.py javi` para uno solo); la receta de cada uno (tempo, escala, instrumentos y ritmos) está en `SPEC` dentro de ese archivo. Si reemplazás un archivo por tu propia canción con el mismo nombre, el juego usa la tuya.
