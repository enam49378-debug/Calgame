# CalFight

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

## Voces de Javi y Clippy

Javi utiliza 15 grabaciones: muerte (4), ulti disponible (2), rival con poca vida (2), baja (2), reposo (2), activación de ulti (1) y daño (2). Alterna variantes, limita los comentarios durante combos y da prioridad a muerte y activación. La voz de activación empieza con la cinemática y se reproduce una sola vez.

Clippy tiene voz para sus nueve bocadillos de Jesuluto: saludo, cinco comentarios, Clipazo, Pantalla Azul y Clippy Gigante. Las intervenciones respetan pausas y prioridades; los demás jugadores reciben la misma frase, voz y bocadillo.

Las voces obedecen **Sonidos del juego** y **Volumen general**, son independientes del ambiente y se limpian al salir/reaparecer. La voz propia se mantiene clara durante las cinemáticas; las ajenas se atenúan por distancia.

Comprobaciones: `npm run test:voces:javi` y `npm run test:voces:clippy` verifican las grabaciones, eventos, prioridades, volumen y sincronización con dos clientes locales.

## Perfiles en la tabla de jugadores

Tab abre y cierra la tabla con el cursor libre. Cada tarjeta muestra la foto de la cuenta y el banner elegido, incluidos los banners subidos. Un clic abre el perfil público: nombre, personaje, K.O. y muertes de la partida, partidas jugadas, horas y favorito. Esc vuelve a la tabla y después al juego; las flechas permiten recorrer las tarjetas. También aparecen los integrantes que siguen en el menú de la sala. Los bots tienen su propia ficha.

Los perfiles se comparten por separado de los estados de combate: los banners subidos se reducen a JPEG de 600 × 172 y hasta 42 KB de texto, y se conservan en la sala para quienes entran tarde. Al cambiar de banner o cuenta se actualizan los demás jugadores. Los perfiles públicos incluyen únicamente nombre, imagen y estadísticas; nunca correo ni credenciales. Las estadísticas de trayectoria corresponden al historial guardado por ese jugador en su navegador, sin rangos ni verificaciones adicionales.

Comprobación: `npm run test:perfiles` (Chrome y Playwright). Prueba tres clientes locales, entrada tardía, cambios de banner, fotos, controles, salida de la sala, contenido inválido, bots, pantalla pequeña y el transporte de relays con un simulador aislado. Usa la puerta de pruebas que el juego ya habilita solo en localhost.


## Comunidad: perfiles, Calsito y amigos

Los perfiles tienen foto propia, biografía, estado, pronombres, acento, seis estilos, ocho auras de avatar y 18 stickers (hasta seis visibles). El catálogo añade ocho fondos ilustrados de la ciudad: plaza, playa, casino, azoteas, lluvia, parque, muelle y arcade. La cuenta verificada del dueño puede conceder y retirar Calsito desde el perfil; los títulos Owner (blanco) y Calsito (amarillo) se comparten con los demás, incluidos invitados, mediante identidad de sala comprobada en Firestore. El logo CAL fue proporcionado por el dueño y se conserva sin cambios.

Amigos incluye solicitudes, aceptación/rechazo, códigos de cuenta, conversaciones privadas persistentes, eliminación de amistad y bloqueo. Los datos se guardan en Firebase y las reglas exigen amistad aceptada para leer o escribir mensajes. Los roles se guardan separados de la apariencia. Las contraseñas y tokens no se comparten con los relays. Los perfiles públicos ahora incluyen el ID necesario para relacionar cuentas, además de su apariencia y estadísticas.

Para activar la base real, seguí **ACTIVAR_COMUNIDAD.md** y publicá **firestore.rules** en el proyecto calgame. La integración se prueba en emuladores; no da por activada una base que todavía no exista. `test:perfiles:v2`, `test:social:reglas` y `test:social` cubren interfaz, permisos e intercambio entre cuentas.

El modo Auto ahora reduce la calidad después de varios segundos de FPS bajos y respeta la selección manual. El compositor se crea solo al necesitar Alta y reduce buffers al salir de esa calidad. Los sistemas de partículas dibujan únicamente instancias vivas; la decoración submarina y las caras lejanas reducen trabajo visual sin cambiar física ni red.


## Controles de celular

En dispositivos táctiles aparece un joystick a la izquierda y se gira la cámara arrastrando el escenario. Los botones permiten golpear, bloquear, saltar, esquivar, activar habilidades y despertar, abrir Amigos, jugadores y pausa. Sekza tiene R para volar, doble toque en la playa para gaviotas y un botón para bajar durante el vuelo. Se recomienda la orientación horizontal. Auto comienza en calidad mínima y puede bajarla más según el rendimiento; la calidad elegida a mano se respeta.

`npm run test:tactil` comprueba movimientos simultáneos, cámara, ataques, habilidades, vuelo, pausa y modo de escritorio en Chrome con pantalla táctil emulada.


La interfaz táctil dispone las habilidades abajo, y agrupa golpe, salto, bloqueo y esquiva a la derecha. El botón **Fijar** activa o desactiva el bloqueo de cámara. **Ajustar** permite arrastrar los controles; **Listo** guarda las posiciones en el navegador y **Restablecer** recupera la distribución original.
