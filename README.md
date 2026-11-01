# Blockstrike Battlegrounds

Arena 3D de peleas anime con jugadores de bloques estilo Minecraft.

**Jugar:** https://enam49378-debug.github.io/Calgame/

## Jugar con amigos
1. Abrí el juego, andá a **Partida → Con amigos** y tocá **Entrar**.
2. Tocá **Copiar link** y mandáselo a tus amigos.
3. Cuando aparezcan en la lista, todos tocan **PELEAR**.

Controles: WASD moverse · Mouse cámara · Clic combo · Espacio saltar · F bloquear · Q esquivar · 1-4 habilidades · G ulti

## Eliminatoria de Javi: Lanza Leal

Si la **Lanza Leal (2)** normal elimina al rival, queda clavada en su cuerpo con sangre estilizada. El daño no aumenta. Javi debe acercarse a la marca **Tu lanza** para recogerla automáticamente; mientras tanto pelea con los puños y sus habilidades de lanza quedan bloqueadas sin consumir recarga.

La lanza permanece aunque reaparezca la víctima. El cuerpo dura 15 segundos; después la lanza queda en el lugar hasta recogerla. Al reaparecer Javi recupera su arma. El impacto, el cuerpo y la recogida se comparten con la sala, incluidos quienes entran tarde.

Comprobaciones: `npm run test:lanza` y `npm run test:lanza:red` (Chrome y Playwright). La segunda conecta tres clientes al servidor local y comprueba daño, reaparición, entrada tardía y recogida.

## Estabilidad de combate

Los impact frames usan un destello de pantalla de hasta 120 ms que termina por sí solo; el mapa sigue dibujándose y sus materiales y visibilidad permanecen intactos. Las habilidades quietas frenan la inercia de carrera o esquiva al empezar. La Paliza de Seb0lla conserva su avance inicial y se detiene al terminar, interrumpirse o perder al objetivo. Verity Gigante se elimina y libera sus recursos al reaparecer o salir de la partida.

Comprobaciones: `npm run test:estabilidad` recorre 72 combinaciones de habilidades normales/despertares, prueba el frenado, la limpieza de la montura y el dibujo con/sin shaders. `npm run test:estabilidad:red` prueba el movimiento y los ataques entre dos jugadores conectados al servidor local.

## Recuperación de imagen

El dibujo se ejecuta al final de cada cuadro aunque falle una actualización. Cada efecto se retira antes de liberar sus recursos: un error de limpieza o animación queda aislado y no se repite indefinidamente bloqueando la pantalla. Los errores de acciones, eventos o audio tampoco impiden actualizar la imagen. Si falla el postprocesado se restaura el destino de dibujo y se continúa sin postprocesado; la pérdida y restauración de WebGL muestran un aviso temporal y recuperan el dibujo normal. La atención de salas en segundo plano ya no cambia el reloj de los cuadros, evitando tiempos negativos.

Los últimos errores se guardan solo en este navegador (`bsb_runtime_errors_v1`) y se pueden consultar con `getBlockstrikeDiagnostics()` en la consola; no se envían a ningún servidor.

`npm run test:recuperacion` reproduce el bloqueo de un efecto agrupado, introduce fallos de limpieza, animación, eventos, audio, acciones y postprocesado, y pierde/restaura el contexto gráfico. `npm run test:combate` simula combates prolongados de varios personajes con audio y verifica que no haya errores registrados.
