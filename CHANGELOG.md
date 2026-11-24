# Registro de versiones

El número de versión tiene tres partes: **grande.medio.pequeño** (por ejemplo 1.6.0).
- **Pequeño** (1.6.1): arreglos.
- **Medio** (1.7.0): contenido o funciones nuevas.
- **Grande** (2.0.0): un cambio de fondo en el juego.

El número actual se ve abajo a la derecha del juego y se manda a los demás jugadores de la sala:
si dos jugadores tienen versiones distintas, el juego avisa para que recarguen con **Ctrl+F5**.
Cada actualización se sube con su número en el mensaje del commit (por ejemplo `v1.6.1: ...`).
Para cambiar la versión: `GAME_VERSION` en `js/game.js`, el texto de `#gamever` en `index.html` y una entrada nueva aquí.

---

## v1.14.0 · 2026-11-23 · Código ordenado y arreglos
- **Código más ordenado:** `js/game.js` bajó de 17.700 a unas 15.400 líneas. Las partes que estaban mezcladas ahora viven en su propio archivo, con el mismo patrón de `js/graficos/` (fábricas que `game.js` crea en su lugar, sin exponer nada en la consola):
  - `js/ui/`: ventanitas (alert, confirm y prompt) y minimapa.
  - `js/editores/`: editores de mapa, audio, animaciones y expresiones (modo desarrollador).
  - `js/modos/voley.js`: el minijuego de vóley playa.
  - `js/graficos/armas.js`: lanza, cetro, espada de vóxeles y ojos brillantes (antes estaban metidos dentro del editor de expresiones).
- **Clima: un solo código para el juego y el servidor** (`js/ambiente.js`). Antes eran dos copias que se habían separado.
- **Arreglo: el clima en multijugador en Selva Esmeralda y Valle Sakura.** El juego usaba el ciclo de clima del mapa y el servidor el de Ciudad Aurora, así que entre paquete y paquete el clima saltaba. Ahora el ciclo viaja dentro del estado y todos usan el mismo.
- **Arreglo: el botón para llamar a la ballena** tiraba un error si el juego estaba en pausa.
- **Arreglo: el número del zoom del minimapa** en Opciones no cambiaba al mover el control.
- **Arreglo: cerrar el editor de animaciones** sin haberlo abierto tiraba un error.
- Limpieza: se quitó la sala P2P vieja (usaba una librería que ya no se carga y nadie la llamaba), una propiedad rota de la API de habilidades (`_v`) y entradas repetidas en esa API.
- Nuevo efecto para coreografías: `fx: 'screenbreak'` (la pantalla se rompe como vidrio y se desvanece).
- Herramientas nuevas en `tools/refactor/` para seguir separando `game.js` de forma segura, y `npm run revisar` para buscar nombres que no existen (errores que solo saltan al ejecutarse esa línea).
- Servidor: `servidor_oracle/subir_a_oracle.ps1` ahora también sube `js/ambiente.js` (hay que volver a correrlo para que el servidor use el clima compartido).

## v1.13.0 · 2026-11-21 · Cielo, nubes, sombras y arreglos
- **Arreglo: el botón Amigos no aparecía** dentro de la partida (la pantalla de título lo dejaba invisible). Ahora sale en la barra de arriba junto a Guía.
- **Arreglo: el cielo rojo de Redbird (Ojo del Cosmos)** se veía como un disco rojo cortado porque la cúpula del cielo crecía más allá de lo que alcanza la cámara. Ahora no cambia de tamaño.
- **Delay entre jugadores:** los ataques y habilidades de los demás ahora se muestran con el mismo retraso que su cuerpo (antes salían un poco adelantados y parecía que el jugador iba atrasado).
- **Sombras:** cubren una zona más grande alrededor del jugador, así que de lejos ya no desaparecen tan pronto.
- **Playa:** menos brillo en la arena y en objetos claros (menos bloom de día y arena un poco más oscura).
- **Cielo y ciclo día/noche:**
  - Las transiciones de color del cielo, la niebla y las nubes son continuas (antes cambiaban de golpe al pasar de día a noche).
  - El atardecer y el amanecer duran más (unas 2 horas del juego en vez de 1).
- **Nubes nuevas:** 30 racimos de bloques con base y bultos, más altas y repartidas por un área más grande. Cambian de color con la hora (blancas, rosadas al atardecer, azules de noche, grises con tormenta) y se mueven más rápido con viento.
- Servidor: el instalador funciona también en máquinas ARM y ajusta el límite de memoria según la RAM.

## v1.12.2 · 2026-11-21 · Arreglo: conexión al servidor global
- La política de seguridad de la página (CSP) bloqueaba las consultas al servidor de Oracle y por eso el juego no lo detectaba y seguía usando los relés. Ahora la dirección del servidor está permitida.
- Si algún día cambia la dirección del servidor en `config/servidor.js`, también hay que ponerla en `connect-src` de `index.html`.

## v1.12.1 · 2026-11-21 · IP fija del servidor
- El servidor de Oracle ahora tiene una **IP pública reservada** (163.176.41.73), que no cambia aunque se apague la máquina. El juego usa `https://163-176-41-73.sslip.io`.

## v1.12.0 · 2026-11-21 · Inmunidad, ping y protección
- **Arreglo: inmunidad al minimizar o salir de la ventana.** Cuando el navegador frenaba el juego, el jugador se quedaba congelado con su tiempo de invulnerabilidad y su ragdoll, y nadie podía pegarle ni matarlo. Ahora, en línea, el juego sigue simulando lo que pasa en segundo plano (por ejemplo, los tiempos y la vida siguen corriendo), así que sigue recibiendo golpes y puede morir.
- **Arreglo: inmunidad con la Guía abierta en línea.** Abrir la Guía ya no da invulnerabilidad en una sala en línea (en solo sigue igual).
- **Ragdoll con límite:** un ragdoll no dura más de unos 3 s para quien lo ve ni para el servidor, aunque el otro jugador se quede congelado o haga trampa.
- **Ping y delays:** con servidor se mandan 30 actualizaciones por segundo (antes 25) y el retraso de suavizado de los otros jugadores es menor; el servidor de Oracle usa una red más rápida (BBR).
- **Protección del servidor:**
  - Detrás de Caddy todos los jugadores parecían venir de la misma IP (127.0.0.1), lo que rompía los límites por IP. Ahora se lee la IP real.
  - Máximo de 12 conexiones por IP y solo las páginas autorizadas (`ALLOWED_ORIGINS`) pueden abrir salas.
  - El puerto 8080 queda cerrado al exterior (solo se entra por HTTPS), el servicio corre con límites (memoria, permisos) y se instalan fail2ban (contra intentos de entrar por SSH) y actualizaciones automáticas de seguridad.
  - El árbitro ya no deja a nadie en ragdoll para siempre.

## v1.11.0 · 2026-11-21 · Sala global
- Botón nuevo en el menú de jugar: **SALA GLOBAL**. Te mete directo en una partida en línea con gente de todo el mundo, sin códigos.
  - Son copias de la misma sala (`global-1`, `global-2`, ...) con hasta 10 jugadores cada una.
  - Entra a la sala global que ya tiene más gente y todavía no está llena; si todas están llenas (o no hay ninguna), abre la siguiente.
  - Las salas globales son públicas y siempre con bots que rellenan los lugares libres.
- Las salas públicas y privadas con código siguen igual que antes.

## v1.10.1 · 2026-11-21 · Servidor de Oracle conectado
- El juego en internet ya usa el servidor de salas de Oracle Cloud (São Paulo) en `https://167-234-237-155.sslip.io`. Es la dirección de `config/servidor.js`.
- Si la IP pública de la máquina cambia (por ejemplo, al apagarla y encenderla), hay que actualizar esa dirección. Para evitarlo se puede reservar la IP.
- Si el servidor no responde, el juego sigue funcionando por relés como antes.

## v1.10.0 · 2026-11-21 · Servidor global configurable
- El juego ya puede conectarse a un servidor de salas que esté en otro sitio que la página (por ejemplo, la página en Vercel y el servidor en Oracle Cloud).
  - La dirección se pone en `config/servidor.js` (vacía = mismo sitio, como antes) o en el link con `?srv=https://...`. En localhost se sigue usando el servidor local.
  - Si el servidor configurado no responde, el juego sigue funcionando como antes (relés).
- El servidor responde con permiso de otros orígenes (CORS) también en las listas de salas, la información de sala y la comprobación de entrada.

## v1.9.1 · 2026-11-21 · Salto para combos
- **Cansancio de salto:** si saltas muchas veces seguidas, cada salto pierde fuerza (hasta la mitad). Se recupera si dejas de saltar un par de segundos. Así no se puede hacer bunny hop alto para escapar.
- **Salto guardado:** si pulsas saltar mientras estás en medio de un golpe, el salto se guarda 0,3 s y sale en cuanto termina el golpe.
- **Golpes en el aire:** mientras pegas en el aire caes muy despacio y avanzas un poco, para poder encadenar combos en el aire (con el uppercut y el downslam).
- El combo se reinicia si pasa más de 1,5 s sin pegar (antes 1,3 s).
- Referencia: se revisó el código de un battleground de Roblox (archivo bat.rbxl del usuario) para tomar valores y reglas, sin copiar su código.

## v1.9.0 · 2026-11-21 · Golpes básicos (M1) mejorados: downslam y uppercut
Inspirado en los battlegrounds de Roblox. Referencias: rblxguide.com (techs) y guías de combos de la comunidad. Los tiempos son una adaptación mía, no datos oficiales.
- **El cuarto golpe del combo ahora puede cambiar** (tras tres golpes):
  - **Downslam:** en el aire, cayendo (o con la tecla C), una patada hacia abajo que ignora el bloqueo y clava al rival en el suelo en ragdoll. Es un golpe de caída: impide el ragdoll cancel.
  - **Uppercut:** con el salto sostenido, subiendo (o en el suelo), un puño hacia arriba que levanta al rival y tú subes con él.
- **Ritmo del combo (cooldowns del M1):**
  - Golpes 1 a 3 más rápidos (0,29 s a 0,27 s) y más tiempo para continuar el combo (1,3 s).
  - Tras el cuarto golpe hay más recuperación (1,0 s); si el cuarto golpe falla, 0,3 s más. Un dash la acorta a 0,25 s.
  - Si pulsas el golpe un poco antes de poder, se guarda y sale en cuanto se puede (buffer de 0,16 s).
  - Cada personaje puede tener su propia velocidad de M1: Soru San (maza) más lento, SoyFrann y Berpol más rápidos.
- Arreglo: Frann y Berpol no tenían definido el uppercut y fallaba al saltar y golpear al cuarto golpe. Ahora usan uno genérico.
- La guía de controles incluye el uppercut y el downslam.

## v1.8.0 · 2026-11-21 · Bloqueo perfecto, Black Flash y embestida
Inspirado en los battlegrounds de Roblox. Las ventanas de tiempo son una adaptación mía de lo que cuentan guías de la comunidad, no datos oficiales.
- **Bloqueo perfecto:** si pulsas bloquear justo antes de recibir un golpe (ventana de 0,22 s desde que empiezas a bloquear), no recibes daño, el rival queda aturdido medio segundo y apareces con chispas rojas.
  - Para evitar el abuso de tocar bloquear sin parar, hace falta haber soltado el bloqueo al menos 0,5 s antes.
  - No funciona contra golpes que rompen la guardia.
- **Black Flash:** después de un bloqueo perfecto, tu siguiente golpe básico (M1) que conecta es un Black Flash durante 4 s: 2,4 veces el daño, rompe la guardia y tira al rival, con rayos negros y rojos y marco de impacto negro.
- **Embestida (dash de frente):** si el dash hacia adelante choca con un rival, le hace daño, lo aturde y lo arrastra mientras dura el dash. Si venías de tres golpes básicos (M1), lo manda rodando (*shove*).
- La guía de controles incluye las tres cosas.

## v1.7.0 · 2026-11-21 · Técnicas de movimiento y cámara
Inspirado en los battlegrounds de Roblox (The Strongest Battlegrounds). Referencias: rblxguide.com (guía de techs y de ragdoll cancel).
- **Dash cancel:** si haces dash y usas una habilidad (o la ulti) enseguida, la habilidad corta el resto del dash y sale al instante.
  - Dash hacia atrás (backdash cancel): conservas parte del retroceso; en el aire llegas más lejos.
  - Dash de lado (micro dash): el impulso queda más corto y rápido.
  - Los golpes M1 no cancelan el dash, y justo al terminar el dash hay una breve recuperación en la que no se puede pegar con M1.
  - Aparece un aviso (BACKDASH CANCEL, MICRO DASH o DASH CANCEL).
- **Ragdoll cancel:** estando tirado en el suelo, un dash de lado o hacia atrás (Q + A, D o S) te levanta al instante. Se puede usar una vez cada 30 s. El dash hacia adelante no sirve.
  - Los golpes pesados de caída (Mazazo, Ban Hammer, Hoja en Blanco y el salto con golpe al suelo de varios personajes) lo impiden.
  - Los bots también lo hacen, de vez en cuando.
- **Cámara que sigue la cabeza:** la cámara acompaña la cabeza del jugador, también durante sus animaciones. En cinemáticas y escenas no la sigue, y al volver al juego se recupera de forma suave. Se puede quitar con `camaraCabeza(false)` en la consola.
- La guía de controles del menú incluye las dos técnicas nuevas.
- Nota: el tiempo exacto de las ventanas y el enfriamiento del ragdoll cancel (30 s) salen de guías de la comunidad y no son datos oficiales del otro juego; se pueden ajustar.

## v1.6.2 · 2026-11-21 · Sombras e iluminación
- Las sombras ya no parpadean: la dirección del sol solo se actualiza en saltos invisibles en vez de rotar un poco en cada cuadro.
- Las sombras de los personajes se actualizan en cada cuadro cuando el juego va fluido (antes cada 2 o 3 cuadros, lo que las hacía temblar al moverse).
- En equipos buenos las sombras suaves usan el doble de resolución.
- Un poco más de luz de relleno y menos dureza del sol: las sombras ya no quedan tan oscuras.
- Nitidez por defecto más baja (de 0.9 a 0.45). Se cambia con `nitidez(valor)` en la consola.

## v1.6.1 · 2026-11-21 · Conexión
- Al entrar a una sala, si el primer intento de conexión falla se reintenta dos veces antes de mostrar el error.
- Se comprobó con dos jugadores en la misma sala que las habilidades, despertares y ultis de Soru San y SoyFrann se ven en el otro jugador sin errores.

## v1.6.0 · 2026-11-21 · Red y multijugador
- Ahora cada jugador manda su número de versión: si alguien tiene una versión distinta (o la caché vieja) aparece un aviso en el feed. Es la causa más común de modelos o habilidades que no se ven.
- Los emotes tienen respaldo: si el aviso de la acción se pierde por la red, el estado del jugador lo reproduce igual en los demás.
- Los cosméticos se vuelven a poner solos cuando el modelo del jugador cambia (transformaciones, skin que llega tarde) en vez de desaparecer.
- Reconexión más clara: avisa "Conexión perdida: reconectando…" y "Conexión recuperada", con espera creciente entre intentos.
- Número de versión visible en el juego y este registro de versiones.

## v1.5.2 · 2026-11-21 · Berpol y habilidades originales
- Personaje nuevo: **Berpol**, ataques de garabatos (todo se dibuja con tinta antes de hacer efecto).
- Soru San y SoyFrann con habilidades rehechas: mecánicas y animaciones por fases, originales.
- Se corrigió que el Faro de Soru y el Wallhack de SoyFrann ralentizaban en vez de acelerar.

## v1.5.1 · 2026-11-21 · Soru San y SoyFrann
- Personajes nuevos: **Soru San** (técnico de Minecraft vanilla, con maza) y **SoyFrann** (hacker).

## v1.5.0 · 2026-11-21 · Lanzamiento público y salas sincronizadas
- Todo lo de la vista privada pasa a ser público.
- Los bots de sala funcionan también sin servidor propio (por relés).
- Cambio de mapa, portales y eventos sincronizados en las salas; los bots hacen sus acciones visibles para todos.

## v1.4.0 · 2026-11-20 · Multijugador con código y capucha
- Entrar a una sala con código (con datos de la sala), crear sala con o sin bots, máximo 10 jugadores.
- Capucha de Javicubito con física y lluvia.
- Proyecto de Roblox con la ciudad exportada.

## v1.3.0 · 2026-11-18 a 2026-11-19 · Mapas y portales
- Tres mapas independientes (Ciudad, Selva, Valle) con rotación por tiempo.
- Portales del multiverso y más vida en los mapas.
- El Owner puede lanzar el portal cuando quiera; inicio con mejor color e iluminación.

## v1.2.0 · 2026-11-15 · Mundo ampliado
- Mapa grande con biomas y agua nadable tierra adentro.
- Ascensor vertical en la Torre Aurora y zonas nuevas; arreglos de choques entre edificios.
- Rendimiento: ocultar lo que no se ve, agrupar objetos y ajustar sombras.

## v1.1.0 · 2026-11-11 a 2026-11-14 · Estilo urbano
- Estilo visual urbano con sombreado de dibujo animado, niebla por altura, bloom, reflejos de lluvia y charcos de neón.
- Efectos de combate, impactos y paneles de cómic en la ulti.
- Puerta de actualizaciones privadas para el Owner.

## v1.0.0 · hasta 2026-11-10 · Base
- Peleadores, habilidades, ciudad en bloques, multijugador por salas, ranking, emotes y cosméticos.
- Texturas de la ciudad rehechas y colisiones de modelos ajustadas.
