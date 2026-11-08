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

## Actualización del mar profundo

- **Mar profundo y oscuro:** a partir de ~60 m de la orilla el agua se oscurece hasta casi negro (superficie, fondo y niebla bajo el agua); en lo más hondo solo se ve el plancton y las luces de los animales.
- **Tiburones solo en lo profundo:** patrullan a más de ~90 m de la orilla y solo atacan a quien nada ahí. En el evento *Frenesí* salen 3 más y suben un poco hacia la costa.
- **Animales nuevos:** mantarrayas que ondulan, tortugas marinas, 18 medusas luminosas que laten, peces abisales (rape) con su linterna y un calamar gigante.
- **Eventos del mar** (aparecen solos cada 55-95 s; se pueden apagar o lanzar a mano en Opciones > Partida y eventos marinos): 🐟 *Cardumen gigante*, 🦈 *Frenesí de tiburones*, ✨ *Marea luminosa* y 🦑 *Calamar gigante*. La ballena saltarina sigue como antes.
- **Cartel:** el panel del centro comercial anuncia la actualización (`assets/billboard/ad_mar.jpg`, se regenera con `python tools/gen_cartel_mar.py`).

## Emotes

- Mantené **B** (se cambia en Opciones > Controles; la guía pasó a **K**) para abrir la **rueda de 12 slots**: movés el mouse hacia un emote y soltás. También hay un botón 😀 arriba, junto a Panel y Guía, y en celular un botón flotante.
- Cada slot muestra **tu modelo haciendo el emote** en vivo.
- **Clic derecho sobre un slot:** se abre la lista de emotes sin cerrar la rueda; tocás uno y se cambia el emote de ese slot.
- Hay **60 emotes**: 15 de poses (Saludo, Karate, Moonwalk…) y 45 animaciones hechas en Blockbench (Dab, Griddy, Thriller, Rueda, Breakdance, Hyperpop…).
- Se desbloquean con **kills, como en TSB**: unos pocos al empezar y el resto desde 2 hasta 390 kills.
- **Solo cuentan las kills en salas públicas contra otros jugadores.** No cuentan las salas privadas, jugar solo, los bots ni los dummies.
- Los emotes solo existen dentro de la partida. Los demás jugadores ven tu emote. Cualquier movimiento, ataque o golpe lo cancela.
- Código: `js/emotes.js`; las animaciones se generan con `python tools/bbmodel_a_emotes.py Emotes.bbmodel` (`js/emote_list.js` + `js/emote_clips.js`, este último se baja solo cuando hace falta).

## Itsukio (ItzUkyo)

Más vida (100 → 112), más velocidad (1.04 → 1.09), más daño (×0.72 → ×0.86), recargas más cortas y números de daño algo más altos en todas sus habilidades. Espada de Fénix dura 12 s.

## Seguridad de las cuentas

Contraseñas fuertes, freno a intentos fallidos, sesión opcional por pestaña, cambio de contraseña y reglas de Firestore más estrictas. Ver [SEGURIDAD.md](SEGURIDAD.md) (incluye lo que hay que activar en la consola de Firebase).

## El mar grande, el torbellino y el Kraken

- **Mar mucho más grande:** ahora llega a ~540 m de la costa y ±350 m de ancho, con rocas, corales luminosos y fondo cada vez más oscuro.
- **Eventos del mar más difíciles de ver:** aparecen solos cada **5 a 9 minutos** (antes cada 1 minuto).
- **Torbellino gigante** en el mar profundo (una columna de luz azul y la señal «EL ABISMO» se ven desde lejos): absorbe poco a poco a quien nada cerca. En el borde se puede escapar nadando; más adentro ya no. Al llegar al centro **caes por una cascada** a la cueva del **Abismo**, muy por debajo del mar.
- **El Abismo:** una cueva enorme con ruinas, cristales luminosos, algas gigantes y un barco hundido. La salida (portal «SUPERFICIE») se abre cuando derrotas al jefe.
- **Jefe final: el KRAKEN (v2).** Duerme en el abismo y solo despierta con el evento «Calamar gigante» (dura 7 min). Entrar al abismo por el torbellino se puede **siempre**; sin evento el Kraken está dormido. Tiene su propio sistema de combate: 8 tentáculos con vida propia (se pueden cortar), brazo aplastante con cinemática IK, barrido, látigo, lluvia de rocas, tinta, succión y rayo ocular al enfurecerse. Se le pega con las habilidades de tu personaje.
- **Recompensas:** al vencerlo suelta emote y cosméticos del abismo. **Cada 50 kills en salas públicas** ganas **1 objeto aleatorio** (emote o cosmético, no por orden). El dueño tiene todo desbloqueado.
- **Evento «Calamar gigante»:** cuando ocurre, el torbellino brilla más y se avisa que el Kraken despertó.

## Cosméticos (estilo anime / cine épico)

- Botón **👑** arriba, junto a Panel, Guía y Emotes: eliges un cosmético por espacio (cabeza, cara, espalda, hombros y aura). Los demás jugadores los ven.
- Los cosméticos tienen panel con **vista previa del modelo** al lado (se anima y cambia al tocar cada objeto). Se consiguen con el premio aleatorio de cada 50 kills públicas; los del abismo, venciendo al Kraken.

### Ranking mundial
En la plaza de la ciudad hay dos carteles: **TOP DEL MES** y **TOP HISTÓRICO** con los 10 jugadores del mundo con más kills en salas públicas (no privadas ni bots). Necesita publicar `firestore.rules` (colecciones `cf_lba` y `cf_lbm`).
- Código: `js/cosmetics.js`, `js/abismo.js`.

### Kraken v3 (privado)
- **Abismo con pasillo:** caes por la cascada, sigues un camino con arcos, cristales, ruinas y un barco hundido, y cruzas el portón hasta la sala del Kraken. Con el evento activo **no se puede salir hasta vencerlo** y si mueres reapareces dentro. Sin evento entras y sales libremente.
- Dentro del abismo el resto del mundo (ciudad, mar, otros jugadores) se oculta para ahorrar rendimiento.
- **Muelle grande + Tablón de eventos + Barco:** al empezar el evento del Calamar llega un barco, espera ~2:30 y zarpa con quien suba; la corriente lo atrapa y cae al abismo (cinemática).
- **Panel H → "Bloquear el evento del Kraken":** truco que impide el evento en privadas y bots (en públicas no aplica).
- El ranking mundial ahora es un cartel pequeño al norte de la ciudad.

### Kraken v4 (privado)
- **Mouse:** con **Shift Lock apagado** el cursor queda libre (se tocan todos los botones; la cámara gira con el click derecho). Con **Shift Lock encendido** el mouse se captura. Al apagarlo se suelta de verdad.
- **Muelle:** ahora es el muelle original agrandado (x1.6 de ancho, x1.7 de largo), con farolas y el barco atracado en la punta.
- **Barco:** modelo nuevo (casco curvo, cabina, chimenea, vela, bandera).
- **Abismo:** camino largo con giros (cascada → jardín de algas → ruinas → naufragios → raíces del Kraken) y **portón enorme** cerrado. Enemigos variados (cangrejo, medusa, rape abisal, marinero ahogado, calamarín) y el **Capitán Ahogado** que suelta la **llave** (solo un jugador la puede tener). Con la llave cerca del portón se abre; sin evento está abierto y sin enemigos.
- **Música del abismo:** pon tus pistas en `musica/abismo_pasillo.mp3`, `musica/abismo_kraken.mp3` y `musica/abismo_calma.mp3`. Si no existen suena la música normal.
- **Consola del Owner (F2):** eventos, barco, teletransportes, llave, portón, enemigos, Kraken y comandos (`/ayuda`). Funciona en todos los modos. En localhost eres owner automáticamente.

### Kraken v5 (privado)
- **Enemigos del abismo mejorados:** modelos con más detalle (púas, percebes, branquias, costillas, algas, capa y sabela del capitán, llamas fantasma), brillo propio, **aparición** emergiendo del suelo, **reacción al golpe** (retroceso y aplastamiento), y **muertes distintas** (la medusa estalla, el cangrejo se voltea, el marinero se desploma en burbujas, el calamarín suelta tinta, el capitán tiene muerte cinemática).
- **Cinemáticas:** el Capitán Ahogado aparece con cámara propia, y el Kraken despierta con una cámara que lo rodea (los jugadores son invulnerables unos segundos).
- **Interacciones por personaje (contra enemigos):** Ukyo prende fuego, Rocket envenena y ralentiza, Redbird marca (+25 %), Javi clava (aturde), Sekza empuja con el viento, Mattux da críticos, Jesuluto provoca «ERROR 404», ElRandi apila Picoteado (×3), Seb0lla cura con Verity, Loki confunde, Capitán Perú pega más fuerte. Cada personaje también tiene su frase al despertar el Kraken.
- **Kraken 1,6 veces más grande**, con ataques nuevos: **Onda sísmica** (anillos que se saltan), **Tormenta de tentáculos** (tres barras giratorias) y **Agarre** (te levanta y te estampa; se evita cortando ese tentáculo). Latigazo y alcances ampliados.

### Kraken v6 (privado) · arreglos
- Los enemigos y el Kraken golpean como jugadores (pasan por `applyHit`): **el parry, el bloqueo y el contraataque funcionan**, y al morir sale «Te noqueó X». Se arregló el K.O. que se quedaba pegado en pantalla.
- **Abismo = mundo aparte:** sin el efecto de «estar bajo el agua» (pantalla azul y sonido apagado), sin sonidos ambientales de la superficie, con su propia niebla y su **propio minimapa** (camino, portón, enemigos, llave y Kraken). Los golpes/efectos de los jugadores del otro mundo (impactos, temblor, cámara lenta) ya no se sienten, y sus modelos no se ven.
- **Colisiones:** el cuerpo del Kraken es sólido, los enemigos se separan entre sí y de los jugadores, el barco tiene colisión en cabina, mástil y barriles. Hitboxes de los ataques del Kraken ajustados a lo que se ve (aplastamiento, barrido).
- **Suelo de la sala del Kraken** arreglado (sin la plataforma elevada que hundía a los jugadores ni parpadeos entre capas).
- **Barco** rehecho como un navío fantasma: madera podrida con algas, vela hecha jirones, óxido, cadenas, calavera de proa, esqueleto al timón, faroles verdes y niebla.
- **Cinemáticas:** muerte del Kraken (cámara orbitando y fuegos) y regreso: un géiser te lanza por el torbellino y apareces en el muelle con fuegos artificiales.

### Kraken v7 (privado)
- **Enemigos rehechos y de miedo:** piel con textura, articulaciones y animaciones propias: cangrejo acorazado con pinzas dentadas y 8 patas articuladas, medusa translúcida con 12 tentáculos y rayos eléctricos, rape abisal con boca de agujas y señuelo, marinero ahogado (calavera, costillas, harapos, algas) y el Capitán Ahogado (sombrero, capa, sable, linterna, llave), calamarín de 8 tentáculos.
- **Barco:** el casco es sólido. Desde el muelle solo se sube por la pasarela; a bordo las bordas te contienen y la cabina, el mástil y los barriles tienen colisión.

### Modelos de Blockbench del abismo
Los enemigos (cangrejo, medusa, rape, marinero, capitán, calamarín) y el barco fantasma son modelos de Blockbench: `modelos/abismo/*.bbmodel`, con huesos y animaciones (idle, walk, attack). Se abren y editan en Blockbench; el juego los carga al iniciar. Los cubos cuyo nombre empieza por `glow_` brillan. `tools/gen_modelos_abismo.py` los regenera. Si un modelo no carga, el juego usa una versión de respaldo hecha por código.

### Kraken v8 (rama mejoras-abismo2)
- Cosmeticos como modelos de Blockbench (`modelos/cosmeticos/*.bbmodel`, generados con `tools/gen_modelos_cosmeticos.py`): 27 cosmeticos, 13 nuevos (kabuto, orejas de gato, sombrero pirata, cuernos de ciervo, gafas, antifaz ninja, mochila, alas de demonio, escudo, hombreras de pinchos, bufanda, dos auras). Menu nuevo con vista previa fija, pestanas por espacio y boton Equipar.
- Lista de emotes mas pequena y solo con nombres. Sin emojis en la interfaz nueva.
- Sonidos sinteticos para el Kraken, las criaturas y el barco (`js/sonidos.js`).
- Colisiones: ya no te teletransporta al saltar sobre un objeto (sales por la cara mas cercana o subes al borde de lo bajo).
- Regeneracion pasiva de vida para todos: tras 5 s sin recibir dano recuperas 2,2 de vida por segundo, hasta un maximo de 45.
- Al morir en el abismo con el Kraken vivo reapareces dentro; el evento ya no termina mientras sigues dentro.
- Abrir la rueda de emotes / la lista / el panel ya no abre el menu de pausa.

### Sunn y Mini (rama mejoras-abismo2)
- **Sunn** (tematica Iron Man): armadura escarlata y dorada. Repulsor, salva de misiles, impacto orbital y propulsores; ulti Rayo del Reactor; al despertar Sobrecarga del Reactor, Drones Reflectores, Satelite Stark y Explosion del Reactor. Vive en `personajes/sunn/`.
- **Mini**: su companera pequena y cabezona (el modelo del jugador, mas chico y con cabeza grande). Sigue a Sunn y le dispara a los rivales (mas rapido con el despertar). Skin en `personajes/mini/skin.png`, logica en `js/mini.js`.
- Barco: a bordo la cubierta cuenta como suelo, ya no se "nada" ni te hundes.

### Sunn original, vuelo y alas de Sekza
- Sunn ya no copia a Redbird ni a Mattux: habilidades propias (`personajes/sunn/Skills/Code/`): Repulsores Gemelos, Salva Stark, Mini al ataque, Mini bombardea, ulti Protocolo Casa Vacia; despierto: Unirrayo Estelar, Enjambre de Drones, Misil Estelar y Armadura Reforzada. Mini participa en sus ataques.
- Sunn vuela con R (como Sekza, 5 s) con pose de Iron Man (inclinado hacia delante al moverse, brazos abiertos al flotar) y llamas en botas y manos. Mini vuela con el.
- El click derecho ya no bloquea: solo mueve la camara (el bloqueo es con F).
- Las alas de Sekza son ahora el modelo de Blockbench `modelos/sekza/alas.bbmodel` (generado con `tools/convertir_alas_sekza.py` desde Alas de sekza.bbmodel), con sus animaciones (idle, walk, fly, flap).
- La skin de Mini tenia la segunda capa en negro opaco: se hizo transparente.
