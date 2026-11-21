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
