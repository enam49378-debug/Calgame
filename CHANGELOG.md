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
