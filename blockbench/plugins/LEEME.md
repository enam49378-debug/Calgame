# Plugins de Blockbench para Blockstrike

Probados en Blockbench 5.2 (versión web). Piden 4.8 o superior; funcionan en el programa y en la web.

## Cómo instalarlos
1. En Blockbench: **Archivo ▸ Plugins ▸ ⋮ ▸ Cargar plugin desde archivo** (en la web: pestaña **Plugins**, botón de cargar desde archivo).
2. Elige `audio_referencia.js` y después `victima_fantasma.js`. No cambies el nombre del archivo: tiene que coincidir con el id del plugin.
3. Los dos aparecen en el menú **Animación**.

## Audio de referencia (`audio_referencia.js`)
Pone un audio en cada animación para guiarte con el tiempo.
- **Cargar audio de referencia…**: elige un mp3, wav, ogg o m4a. Se guarda dentro del proyecto, por animación.
- La **onda de sonido** se dibuja sobre la regla de la línea de tiempo y sigue el zoom y el desplazamiento.
- **Suena al reproducir** (respeta la velocidad y se reinicia en cada vuelta del bucle). Con "Sonar al arrastrar el cabezal" también suena un instante al mover el cabezal.
- **Desfase del audio…**: mueve el audio en el tiempo. **Ajustar duración al audio**: la animación dura lo mismo que el audio.
- **Silenciar** y **Quitar audio** también están en el menú.

## Víctima fantasma (`victima_fantasma.js`)
Muestra a la víctima en la vista 3D mientras animas al atacante, sin que esté dentro del modelo.
- La víctima es una copia del esqueleto del proyecto y se anima con **otra animación del mismo proyecto**.
  Automático: `cine_X` usa `cine_vic_X`; también `X_vic` o `vic_X`. O elige la que quieras en el cuadro.
- **Animación ▸ Víctima fantasma…**: posición (x, y, z en unidades de Blockbench; 16 = 1 metro), giro, color, opacidad, textura del modelo.
- **Trayectoria vpos**: pega la lista `vpos` del juego, por ejemplo `vpos: [[0,0,0,1.5,0],[.5,0,0,1.5,0]]`, y la víctima se mueve igual que en el juego
  (formato `[tiempo, x, y, z, giro, 'i'|'o'|'c']`, en metros y radianes; los frenos `'i'`, `'o'` y `'c'` se respetan).
- El modelo se considera mirando a -Z (Norte); si el tuyo mira al otro lado, desmarca esa casilla.
- Con el interruptor **Mostrar víctima** la enciendes y apagas. La configuración se guarda con el proyecto.
