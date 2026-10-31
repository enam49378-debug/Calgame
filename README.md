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
