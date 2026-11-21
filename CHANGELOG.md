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
